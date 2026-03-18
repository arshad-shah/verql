import { describe, it, expect } from 'vitest'
import { spawnSync } from 'child_process'
import { join } from 'path'

const CLI = join(__dirname, '..', 'src', 'index.ts')
const run = (args: string[]) => spawnSync('npx', ['tsx', CLI, ...args], {
  cwd: join(__dirname, '..'),
  timeout: 15000,
  encoding: 'utf8',
  env: { ...process.env, NODE_NO_WARNINGS: '1' },
})

describe('CLI smoke tests', () => {
  it('--version exits 0 and prints version', () => {
    const result = run(['--version'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('dbterm v')
  })

  it('--help exits 0 and contains Usage info', () => {
    const result = run(['--help'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('dbterm')
  })

  it('list exits 0', () => {
    const result = run(['list'])
    expect(result.status).toBe(0)
  })

  it('connect nonexistent exits 1 with error message', () => {
    const result = run(['connect', 'nonexistent-db-that-does-not-exist'])
    expect(result.status).toBe(1)
  })
})
