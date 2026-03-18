import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node22',
  shims: true,
  clean: true,
  external: ['better-sqlite3', 'pg', 'mysql2', 'mssql', 'mongodb'],
})
