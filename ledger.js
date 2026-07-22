// MCP usage ledger for the Shared Whiteboard.
//
// Records ONE line per MCP tool call — tool name, timing, ok/err, and arg/result
// byte sizes — to an append-only JSONL file, so the tool surface can be profiled
// and trimmed (which tools are hot, slow, error-prone, or token-heavy).
//
// Recording is OFF until turned on from the CLI (`wb ledger on`). The MCP server
// checks the on/off flag cheaply (statSync + mtime cache) before every write, so
// toggling takes effect in ALREADY-RUNNING sessions without a restart. The flag
// and events live under DATA_DIR (the stable $HOME location, not the versioned
// module dir), so every MCP session AND the CLI reader share one ledger.
//
// Args are summarized (keys + byte sizes), never stored raw — the ledger stays
// small and never persists large SVG/text payloads.
import fs from 'node:fs'
import path from 'node:path'
import { DATA_DIR } from './data-dir.js'

const LEDGER_DIR = process.env.WB_LEDGER_DIR || path.join(DATA_DIR, 'ledger')
const CONFIG_FILE = path.join(LEDGER_DIR, 'config.json')
const EVENTS_FILE = path.join(LEDGER_DIR, 'events.jsonl')

export const paths = { dir: LEDGER_DIR, config: CONFIG_FILE, events: EVENTS_FILE }

function readConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) } catch { return {} }
}
function writeConfig(cfg) {
  fs.mkdirSync(LEDGER_DIR, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2))
}

// mtime-cached enabled check — cheap enough to call before every tool invocation.
// Only re-parses the config when the file actually changed (or on first read).
let _cache = { mtimeMs: -1, enabled: false }
export function isEnabled() {
  try {
    const st = fs.statSync(CONFIG_FILE)
    if (st.mtimeMs !== _cache.mtimeMs) _cache = { mtimeMs: st.mtimeMs, enabled: !!readConfig().enabled }
    return _cache.enabled
  } catch {
    return false // no config file => never enabled
  }
}

export function enable() {
  writeConfig({ ...readConfig(), enabled: true, enabledAt: new Date().toISOString() })
  return status()
}
export function disable() {
  writeConfig({ ...readConfig(), enabled: false, disabledAt: new Date().toISOString() })
  return status()
}

// Append one event as a JSONL line. No-op (returns false) unless recording is
// enabled. Never throws — a ledger failure must not break the tool call it
// observes; the caller wraps its own work regardless.
export function record(ev) {
  try {
    if (!isEnabled()) return false
    fs.mkdirSync(LEDGER_DIR, { recursive: true })
    fs.appendFileSync(EVENTS_FILE, `${JSON.stringify(ev)}\n`)
    return true
  } catch {
    return false
  }
}

function countLines(file) {
  const raw = fs.readFileSync(file, 'utf8')
  return raw ? raw.split('\n').filter(Boolean).length : 0
}

export function status() {
  const cfg = readConfig()
  let events = 0
  let sizeBytes = 0
  try { sizeBytes = fs.statSync(EVENTS_FILE).size } catch { /* no events yet */ }
  try { events = countLines(EVENTS_FILE) } catch { /* no events yet */ }
  return {
    enabled: !!cfg.enabled,
    enabledAt: cfg.enabledAt || null,
    disabledAt: cfg.disabledAt || null,
    events,
    sizeBytes,
    dir: LEDGER_DIR,
    eventsFile: EVENTS_FILE,
  }
}

// Parsed events, optionally only the last `limit`.
export function readEvents(limit) {
  let lines
  try { lines = fs.readFileSync(EVENTS_FILE, 'utf8').split('\n').filter(Boolean) } catch { return [] }
  if (limit && lines.length > limit) lines = lines.slice(-limit)
  return lines.map((l) => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
}

export function clear() {
  try { fs.rmSync(EVENTS_FILE) } catch { /* already gone */ }
  return { cleared: true, eventsFile: EVENTS_FILE }
}

const pct = (arr, p) => {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]
}

// Aggregate per-tool: calls, errors, latency percentiles, arg/result byte totals.
// This is the optimization payload — sort by calls to see the hot tools, by
// avgResBytes / errorRate to find the token-heavy or fragile ones.
export function aggregate(events = readEvents()) {
  const byTool = {}
  for (const e of events) {
    const t = (byTool[e.tool] ??= { tool: e.tool, calls: 0, errors: 0, ms: [], argBytes: 0, resBytes: 0 })
    t.calls++
    if (e.ok === false) t.errors++
    if (Number.isFinite(e.ms)) t.ms.push(e.ms)
    t.argBytes += e.argBytes || 0
    t.resBytes += e.resBytes || 0
  }
  const tools = Object.values(byTool).map((t) => ({
    tool: t.tool,
    calls: t.calls,
    errors: t.errors,
    errorRate: t.calls ? Math.round((t.errors / t.calls) * 100) / 100 : 0,
    msP50: pct(t.ms, 50),
    msP95: pct(t.ms, 95),
    msMax: t.ms.length ? Math.max(...t.ms) : 0,
    argBytes: t.argBytes,
    resBytes: t.resBytes,
    avgResBytes: t.calls ? Math.round(t.resBytes / t.calls) : 0,
  })).sort((a, b) => b.calls - a.calls)
  const totals = {
    events: events.length,
    tools: tools.length,
    errors: tools.reduce((s, t) => s + t.errors, 0),
    argBytes: tools.reduce((s, t) => s + t.argBytes, 0),
    resBytes: tools.reduce((s, t) => s + t.resBytes, 0),
    span: events.length ? { from: events[0].iso, to: events[events.length - 1].iso } : null,
  }
  return { totals, tools }
}
