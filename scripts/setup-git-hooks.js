const { execSync } = require('child_process')

try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
  execSync('git config core.hooksPath .githooks', { stdio: 'inherit' })
} catch {
  /* zip indirme / CI’de .git yoksa atla */
}
