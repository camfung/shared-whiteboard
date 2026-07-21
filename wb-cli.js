#!/usr/bin/env node
// wb — CLI for the Shared Whiteboard.
//
// A thin proxy over the sync backend's HTTP API, the same one the MCP server
// speaks. Commands are grouped as `wb <group> <command>` (board | read | create
// | edit | template). Because the MCP keeps a per-session "current board" in
// memory and a CLI can't, the active board is persisted to a small state file
// (see STATE_FILE). `wb board open <name>` sets it; every read/edit command
// targets it. Override per-call with --board <name|id>.
import { readFileSync, writeFileSync, mkdirSync, existsSync, openSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, execFileSync } from 'node:child_process'

const BASE = process.env.WB_URL || 'http://127.0.0.1:5858'
const STATE_FILE = process.env.WB_STATE || join(homedir(), '.config', 'shared-whiteboard', 'state.json')

// ---- server lifecycle (this CLI owns the sync backend, no systemd needed) ----
// wb-cli.js lives in the repo root, so its own dir is the clone. In a dev clone
// (node_modules present) prefer the source entry for live edits; in a plugin
// install (no node_modules) server.js can't import its deps, so run the
// self-contained bundle instead.
const REPO_DIR = dirname(fileURLToPath(import.meta.url))
const SERVER_ENTRY = (existsSync(join(REPO_DIR, 'node_modules'))
  ? ['server.js', 'dist/server.cjs']
  : ['dist/server.cjs', 'server.js']
).map((f) => join(REPO_DIR, f)).find(existsSync)
const SERVER_HOST = process.env.WB_HOST || '0.0.0.0'                 // 0.0.0.0 → LAN/iPad reachable
const SERVER_PORT = process.env.WB_PORT || new URL(BASE).port || '5858'
const LOG_FILE = join(homedir(), '.local', 'state', 'shared-whiteboard', 'server.log')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- persisted "current board" ----
function loadState() {
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')) } catch { return {} }
}
function saveState(s) {
  mkdirSync(dirname(STATE_FILE), { recursive: true })
  writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
}

// ---- HTTP ----
async function api(path, method = 'GET', body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    die(`whiteboard backend unreachable at ${BASE} (is the sync server running?): ${e.message}`)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) die(data.error || `HTTP ${res.status}`)
  return data
}

// board-scoped call: resolve active board (flag > state), append ?board=<id>
async function bapi(path, method, body, flags) {
  const id = await requireBoard(flags)
  const sep = path.includes('?') ? '&' : '?'
  return api(`${path}${sep}board=${encodeURIComponent(id)}`, method, body)
}

async function resolveBoard(nameOrId) {
  const { matches } = await api(`/boards/find?q=${encodeURIComponent(nameOrId)}`)
  if (matches.length === 0) die(`no board matching "${nameOrId}". Run: wb list_boards`)
  if (matches.length > 1) die(`ambiguous "${nameOrId}" — open by id. Matches: ${matches.map((m) => `${m.name} (${m.id})`).join(', ')}`)
  return matches[0]
}

async function requireBoard(flags) {
  if (flags.board) return (await resolveBoard(flags.board)).id
  const s = loadState()
  if (s.id) return s.id
  die('no active board. Run: wb open <name>   (or pass --board <name|id>)')
}

// ---- arg parsing: `--key value` flags, JSON-coerced (numbers/bools/arrays) ----
function parseFlags(argv) {
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) die(`unexpected argument "${a}" (use --key value)`)
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) { flags[key] = true; continue }
    flags[key] = coerce(next); i++
  }
  return flags
}
// "100" -> 100, "true" -> true, '["a"]' -> array, "hi" -> "hi"
function coerce(v) { try { return JSON.parse(v) } catch { return v } }

function pick(flags, keys) {
  const o = {}
  for (const k of keys) if (flags[k] !== undefined) o[k] = flags[k]
  return o
}

// Build a read query-string from flags (board= is appended later by bapi).
function qs(f = {}) {
  const p = new URLSearchParams()
  if (f.since != null && f.since !== true) p.set('since', String(f.since))
  if (f.type) p.set('type', f.type)
  if (f.color) p.set('color', f.color)
  if (f.text) p.set('text', f.text)
  if (Array.isArray(f.ids) && f.ids.length) p.set('ids', f.ids.join(','))
  if (f.hops != null && f.hops !== true) p.set('hops', String(f.hops))
  if (f.fields) p.set('fields', f.fields)
  const s = p.toString()
  return s ? `?${s}` : ''
}

function out(obj) { console.log(JSON.stringify(obj, null, 2)) }
function die(msg) { console.error(`error: ${msg}`); process.exit(1) }

// ---- server lifecycle helpers ----
async function serverUp() {
  try { return (await fetch(`${BASE}/health`)).ok } catch { return false }
}
// PIDs of any backend (source or bundle) running out of THIS clone. Matches the
// full command line via pgrep; excludes this CLI (wb-cli.js) by construction.
function serverPids() {
  const pids = new Set()
  for (const entry of ['server.js', 'dist/server.cjs']) {
    try {
      const out = execFileSync('pgrep', ['-f', join(REPO_DIR, entry)], { encoding: 'utf8' })
      for (const l of out.split('\n')) { const p = l.trim(); if (p) pids.add(Number(p)) }
    } catch { /* pgrep exits 1 when nothing matches */ }
  }
  return [...pids]
}
// Process start time for a pid: elapsed seconds (etimes) + wall-clock start
// (lstart). Null if the pid is gone or ps is unavailable.
function procStart(pid) {
  try {
    const raw = execFileSync('ps', ['-o', 'etimes=,lstart=', '-p', String(pid)], { encoding: 'utf8' }).trim()
    const m = raw.match(/^(\d+)\s+(.+)$/)
    if (!m) return null
    return { secs: Number(m[1]), since: localIso(new Date(m[2])) }
  } catch { return null }
}
// Local-time ISO-8601 with offset, e.g. 2026-07-20T13:30:29-07:00 (not UTC).
function localIso(d) {
  const p = (n) => String(n).padStart(2, '0')
  const off = -d.getTimezoneOffset(), sign = off >= 0 ? '+' : '-', a = Math.abs(off)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${sign}${p(Math.floor(a / 60))}:${p(a % 60)}`
}
function fmtDuration(s) {
  s = Math.max(0, Math.floor(s))
  const d = Math.floor(s / 86400); s %= 86400
  const h = Math.floor(s / 3600); s %= 3600
  const m = Math.floor(s / 60), sec = s % 60
  return [d && `${d}d`, (d || h) && `${h}h`, (d || h || m) && `${m}m`, `${sec}s`].filter(Boolean).join(' ')
}
async function startServer() {
  if (await serverUp()) return { already: true, url: BASE, pids: serverPids() }
  if (!SERVER_ENTRY) die('no backend entry found (server.js / dist/server.cjs)')
  mkdirSync(dirname(LOG_FILE), { recursive: true })
  const fd = openSync(LOG_FILE, 'a')                                 // detached child logs here
  const child = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: REPO_DIR, detached: true, stdio: ['ignore', fd, fd],
    env: { ...process.env, WB_HOST: SERVER_HOST, WB_PORT: SERVER_PORT },
  })
  child.unref()
  for (let i = 0; i < 100; i++) { if (await serverUp()) return { started: true, pid: child.pid, entry: SERVER_ENTRY, url: BASE, log: LOG_FILE }; await sleep(100) }
  die(`backend failed to start on ${BASE} — check ${LOG_FILE}`)
}
async function stopServer() {
  const pids = serverPids()
  for (const pid of pids) { try { process.kill(pid, 'SIGTERM') } catch { /* already gone */ } }
  for (let i = 0; i < 50; i++) { if (!(await serverUp()) && !serverPids().length) break; await sleep(100) }
  return { stopped: pids, up: await serverUp() }
}

// ---- commands, grouped as `wb <namespace> <sub> [--flags]`. ----
const cmds = {
  board: {
    list: () => api('/boards'),
    open: async (f) => {
      const name = f.name ?? f._[0]
      if (!name) die('board open needs --name <board> (or positional)')
      const b = await resolveBoard(name)
      saveState(b)
      const board = await api(`/board?board=${encodeURIComponent(b.id)}`)
      return { opened: b, ...board }
    },
    create: async (f) => {
      const name = f.name ?? f._[0]
      if (!name) die('board create needs --name <board> (or positional)')
      const b = await api('/boards', 'POST', { name })
      saveState(b)
      return { created: b }
    },
    rename: (f) => api('/boards/rename', 'POST', pick(f, ['name', 'id'])),
    delete: async (f) => {
      const name = f.name ?? f._[0]
      const b = await resolveBoard(name)
      await api('/boards/delete', 'POST', { id: b.id })
      const s = loadState(); if (s.id === b.id) saveState({})
      return { deleted: b }
    },
    current: () => loadState(),
  },

  read: {
    board: (f) => bapi(`/board${qs(f)}`, 'GET', undefined, f),
    list: (f) => bapi(`/shapes${qs({ ...f, fields: 'index' })}`, 'GET', undefined, f),
    shapes: (f) => bapi(`/shapes${qs({ ...f, fields: 'full' })}`, 'GET', undefined, f),
    neighbors: (f) => bapi(`/neighbors${qs(f)}`, 'GET', undefined, f),
    overlap: (f) => bapi('/overlap', 'GET', undefined, f),
  },

  create: {
    node: (f) => bapi('/node', 'POST', pick(f, ['text', 'x', 'y', 'w', 'shape', 'color', 'fill']), f),
    text: (f) => bapi('/text', 'POST', pick(f, ['text', 'x', 'y', 'color', 'size']), f),
    note: (f) => bapi('/note', 'POST', pick(f, ['text', 'x', 'y', 'color']), f),
    uml: (f) => bapi('/uml', 'POST', pick(f, ['name', 'x', 'y', 'fields', 'methods', 'color']), f),
  },

  edit: {
    node: (f) => bapi('/update', 'POST', pick(f, ['id', 'text', 'x', 'y', 'w', 'color', 'fill']), f),
    uml: (f) => bapi('/update', 'POST', pick(f, ['id', 'name', 'fields', 'methods', 'color', 'x', 'y', 'w']), f),
    field: (f) => bapi('/uml/add', 'POST', pick(f, ['id', 'field']), f),
    method: (f) => bapi('/uml/add', 'POST', pick(f, ['id', 'method']), f),
    connect: (f) => bapi('/connect', 'POST', pick(f, ['fromId', 'toId', 'text', 'color', 'dashed']), f),
    move: (f) => bapi('/move-container', 'POST', pick(f, ['id', 'x', 'y', 'dx', 'dy']), f),
    // whole board, or scoped to a container when --id is given
    space: (f) => bapi('/space', 'POST', { ...(f.gap != null ? { gap: f.gap } : {}), ...(f.id ? { container: f.id } : {}) }, f),
    delete: (f) => bapi('/delete', 'POST', pick(f, ['ids']), f),
    clear: (f) => bapi('/clear', 'POST', {}, f),
    reflow: (f) => bapi('/reflow-labels', 'POST', {}, f),
    ops: async (f) => {
      let ops = f.ops
      if (ops === undefined) { // read JSON from stdin: an array, or {ops:[...]}
        const raw = readFileSync(0, 'utf8').trim()
        if (!raw) die('edit ops needs --ops <json-array> or JSON on stdin')
        const parsed = JSON.parse(raw)
        ops = Array.isArray(parsed) ? parsed : parsed.ops
      }
      return bapi('/batch', 'POST', { ops }, f)
    },
  },

  template: {
    list: () => api('/templates'),
    save: (f) => bapi('/templates/save-from', 'POST', pick(f, ['name', 'ids']), f),
    stamp: (f) => bapi('/templates/stamp', 'POST', pick(f, ['name', 'x', 'y']), f),
    delete: (f) => api('/templates/delete', 'POST', pick(f, ['name'])),
  },

  server: {
    status: async () => {
      const pids = serverPids()
      const st = pids.length ? procStart(pids[0]) : null
      return {
        up: await serverUp(), url: BASE, pids,
        upSince: st ? st.since : null,
        upTime: st ? fmtDuration(st.secs) : null,
        entry: SERVER_ENTRY, log: LOG_FILE,
      }
    },
    start: () => startServer(),
    stop: () => stopServer(),
    restart: async () => { await stopServer(); return startServer() },
    // Rebuild the plugin bundle (dist/*.cjs + web UI) from source, then restart.
    rebuild: async () => {
      execFileSync(process.execPath, [join(REPO_DIR, 'scripts', 'build-plugin.mjs')], { cwd: REPO_DIR, stdio: 'inherit' })
      await stopServer()
      return startServer()
    },
    logs: (f) => {
      if (!existsSync(LOG_FILE)) die(`no log yet at ${LOG_FILE} (start the server with 'wb server start')`)
      execFileSync('tail', [...(f.follow || f.f ? ['-f'] : []), '-n', String(f.n ?? 40), LOG_FILE], { stdio: 'inherit' })
      return { log: LOG_FILE }
    },
    open: async () => {
      await startServer()
      for (const b of ['xdg-open', 'google-chrome', 'chromium', 'firefox']) {
        try { spawn(b, [BASE], { detached: true, stdio: 'ignore' }).unref(); break } catch { /* try next */ }
      }
      return { opened: BASE }
    },
    url: () => ({ url: BASE }),
  },
}

const HELP = `wb — Shared Whiteboard CLI

Usage:  wb <group> <command> [--key value ...]

Backend:  ${BASE}   (override with WB_URL)
State:    ${STATE_FILE}   (active board; override with WB_STATE)

Values are JSON-coerced: --x 100 -> number, --dashed true -> bool,
--ids '["shape:a","shape:b"]' -> array. Anything else stays a string.

board — manage boards
  board list
  board open     --name <board|id>         set active board
  board create   --name <board>            create + set active
  board rename   --name <new> [--id <id>]
  board delete   --name <board|id>
  board current                            show active board

read — read the active board
  read board     [--since N] [--type --color --text --ids '[..]']   full board, or delta since a clock
  read list      [--type --color --text]                            compact index (id/type/label)
  read shapes    [--ids '[..]'] [--type --color --text]             full detail for a subset
  read neighbors --ids '[..]' [--hops 1]                            a shape + its arrow-linked neighbors
  read overlap                                                      layout-quality check

create — create shapes
  create node    --text .. --x .. --y .. [--w --h --shape --color --fill]
  create text    --text .. --x .. --y .. [--color --size]
  create note    --text .. --x .. --y .. [--color]
  create uml     --name .. --x .. --y .. [--fields '[..]' --methods '[..]' --color]

edit — edit the active board
  edit node      --id .. [--text --x --y --w --h --color --fill]
  edit uml       --id .. [--name --fields --methods --color --x --y --w]
  edit field     --id .. --field ".."
  edit method    --id .. --method ".."
  edit connect   --fromId .. --toId .. [--text --color --dashed]
  edit move      --id .. [--x --y --dx --dy]        move a container + its contents
  edit space     [--gap 60] [--id <container>]      tidy spacing (whole board, or one container)
  edit delete    --ids '["shape:a"]'
  edit clear
  edit reflow
  edit ops       --ops '[{...}]'                    (or pipe JSON on stdin)

template — reusable templates
  template list
  template save   --name .. --ids '[..]'
  template stamp  --name .. --x .. --y ..
  template delete --name ..

server — control the sync backend (no systemd needed)
  server status                            up? + pids + entry + log path
  server start                             spawn the backend (detached) if down
  server stop                              stop this clone's backend
  server restart                           stop + start (picks up source edits)
  server rebuild                           rebuild dist/ bundle + web UI, then restart
  server logs     [--n 40] [--follow]      tail the backend log
  server open                              ensure up, open the board in a browser
  server url                               print the backend URL

Every command accepts --board <name|id> to target a board for one call
without changing the active board.   Run 'wb <group> help' for a group's commands.`

function groupHelp(ns) {
  return `wb ${ns} — commands:\n  ${Object.keys(cmds[ns]).map((s) => `${ns} ${s}`).join('\n  ')}\n\nRun 'wb help' for full usage.`
}

async function main() {
  const [ns, sub, ...rest] = process.argv.slice(2)
  if (!ns || ns === 'help' || ns === '--help' || ns === '-h') { console.log(HELP); return }
  const group = cmds[ns]
  if (!group) die(`unknown group "${ns}". Run: wb help`)
  if (!sub || sub === 'help') { console.log(groupHelp(ns)); return }
  const handler = group[sub]
  if (!handler) die(`unknown command "${ns} ${sub}". Try: wb ${ns} help`)
  // split positionals (before any --flag) from flags
  const cut = rest.findIndex((a) => a.startsWith('--'))
  const positionals = cut === -1 ? rest : rest.slice(0, cut)
  const flagArgs = cut === -1 ? [] : rest.slice(cut)
  const flags = parseFlags(flagArgs)
  flags._ = positionals
  out(await handler(flags))
}

main().catch((e) => die(e.message || String(e)))
