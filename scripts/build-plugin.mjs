// Build the zero-install plugin bundle into dist/.
//
// Produces self-contained CJS bundles (all node deps inlined) so the plugin runs
// from a git checkout with NO node_modules — required for GitHub / community
// marketplace installs, which don't run `npm install`.
//
//   dist/mcp-server.cjs   the stdio MCP server (entry in .mcp.json)
//   dist/server.cjs       the sync backend it spawns
//   dist/web/dist/        the built tldraw web UI, served by server.cjs
import { build } from 'esbuild'
import { rmSync, mkdirSync, cpSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(ROOT, 'dist')

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const common = {
  platform: 'node',
  format: 'cjs',
  bundle: true,
  target: 'node18',
  absWorkingDir: ROOT,
  logLevel: 'info',
  // ws's optional native speedups. Absent here → keep them as runtime requires
  // (ws already wraps them in try/catch and falls back to pure JS).
  external: ['bufferutil', 'utf-8-validate'],
  // CJS output has no `import.meta.url`; esbuild leaves it undefined. Rebind it
  // to a value derived from __filename so `fileURLToPath(import.meta.url)` (used
  // to locate server.cjs and the web UI) resolves to the bundle's own dir.
  define: { 'import.meta.url': 'import_meta_url' },
  banner: { js: "const import_meta_url = require('url').pathToFileURL(__filename).href;" },
}

await build({ ...common, entryPoints: ['mcp-server.js'], outfile: path.join(OUT, 'mcp-server.cjs') })
await build({ ...common, entryPoints: ['server.js'], outfile: path.join(OUT, 'server.cjs') })

// Build the web UI and ship it beside server.cjs (which serves ./web/dist
// relative to its own location).
execSync('npm run build', { cwd: path.join(ROOT, 'web'), stdio: 'inherit' })
cpSync(path.join(ROOT, 'web', 'dist'), path.join(OUT, 'web', 'dist'), { recursive: true })

console.log('\n✔ plugin bundle written to dist/')
