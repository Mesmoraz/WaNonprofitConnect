#!/usr/bin/env node
// Runs the acceptance tests locally the way GitHub does: on an empty database with the same 13 sample
// organizations, so posts, threads and accounts from earlier runs can't slow Admin down or crowd a test out.
//
//   node scripts/e2e-fresh.js              every test
//   node scripts/e2e-fresh.js e2e/admin    any Playwright arguments
//
// It uses its own LocalDB database, WaNonprofitConnect_E2E, never the everyday WaNonprofitConnect_Dev.
// Stop any API running on port 5253 first: Playwright would reuse it, and its database.
const { execFileSync } = require('node:child_process')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const app = path.join(root, 'app')
const env = {
  ...process.env,
  ConnectionStrings__Default: 'Server=(localdb)\\mssqllocaldb;Database=WaNonprofitConnect_E2E;Trusted_Connection=True;MultipleActiveResultSets=true',
  Data__LoadOnStartup: 'false',   // the sample, not the whole IRS list
}
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' })
const cli = (...args) => run('dotnet', ['run', '--project', 'src/WaNonprofitConnect.Cli', '--', ...args])

async function main() {
  const busy = await fetch('http://localhost:5253/health').then(() => true, () => false)
  if (busy) {
    console.error('An API is already running on port 5253. Stop it first, so the tests start their own on the test database.')
    process.exit(1)
  }
  cli('reset-test-db')
  cli('import-zips', '--file', 'tests/acceptance/fixtures/zcta_sample.txt')
  cli('import', 'bmf', '--state', 'WA', '--file', 'tests/acceptance/fixtures/eo_wa_sample.csv')
  run('npm', ['run', 'build'], app)
  run('npx', ['playwright', 'test', ...process.argv.slice(2)], app)
}

main().catch(e => { console.error(e.message); process.exit(1) })
