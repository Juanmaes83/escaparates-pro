import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { spawn } from 'node:child_process'

async function collectTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectTests(fullPath)))
    } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(relative(process.cwd(), fullPath))
    }
  }
  return files.sort()
}

const tests = await collectTests(join(process.cwd(), 'src'))
if (tests.length === 0) {
  console.error('No TypeScript tests were found under src/')
  process.exit(1)
}

const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const child = spawn(executable, ['tsx', '--test', ...tests], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: false,
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Test runner terminated by signal ${signal}`)
    process.exit(1)
  }
  process.exit(code ?? 1)
})
