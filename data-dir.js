// Where persisted boards + templates live.
//
// Deliberately NOT under the module directory. As an installed Claude Code
// plugin the code lives at a version-stamped path (…/shared-whiteboard/<version>/),
// so keying data to it would orphan every board on each version bump. A stable
// $HOME location survives updates. Override with WB_DATA_DIR (e.g. to keep a
// repo-local ./data during development).
import os from 'node:os'
import path from 'node:path'

export const DATA_DIR = process.env.WB_DATA_DIR || path.join(os.homedir(), '.shared-whiteboard')
