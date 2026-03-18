import inquirer from 'inquirer'
import type { DbAdapter } from '../db/adapter.js'
import { theme, box, divider } from '../ui/theme.js'

const W = () => process.stdout.columns ?? 120

export function transactionBadge(adapter: DbAdapter): string {
  if (adapter.isInTransaction()) {
    return theme.warn(' ⚡ TXN ACTIVE ')
  }
  return ''
}

export async function transactionMenu(adapter: DbAdapter): Promise<void> {
  console.log()

  const isActive = adapter.isInTransaction()

  if (!isActive) {
    console.log(box('Transaction', [
      theme.muted('No active transaction.'),
      '',
      theme.muted('Starting a transaction lets you run multiple statements'),
      theme.muted('and either COMMIT (save all) or ROLLBACK (undo all).'),
    ], W(), theme.primary))
    console.log()

    const { action } = await inquirer.prompt([{
      type: 'list', name: 'action',
      message: 'Transaction:',
      choices: [
        { name: `${theme.warn('⚡')}  BEGIN transaction`, value: 'begin' },
        { name: theme.muted('← Cancel'), value: 'cancel' },
      ],
    }])

    if (action === 'begin') {
      try {
        await adapter.beginTransaction()
        console.log(box('Transaction Started', [
          theme.warn('⚡ Transaction is now ACTIVE'),
          '',
          theme.muted('All queries run until COMMIT or ROLLBACK are wrapped'),
          theme.muted('in this transaction. Other connections cannot see your'),
          theme.muted('changes until you COMMIT.'),
        ], W(), theme.warn))
      } catch (err: any) {
        console.log(theme.error(`\n  Failed to start transaction: ${err.message}\n`))
      }
    }
    return
  }

  // Active transaction
  console.log(box('Transaction Active ⚡', [
    theme.warn('A transaction is currently open.'),
    '',
    theme.muted('COMMIT  — save all changes permanently'),
    theme.muted('ROLLBACK — undo all changes since BEGIN'),
  ], W(), theme.warn))
  console.log()

  const { action } = await inquirer.prompt([{
    type: 'list', name: 'action',
    message: 'What to do?',
    choices: [
      { name: `${theme.success('✓')}  COMMIT — save all changes`, value: 'commit' },
      { name: `${theme.error('✕')}  ROLLBACK — discard all changes`, value: 'rollback' },
      { name: theme.muted('← Continue (keep transaction open)'), value: 'cancel' },
    ],
  }])

  if (action === 'cancel') return

  if (action === 'commit') {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm', name: 'confirm',
      message: theme.success('COMMIT all changes? This cannot be undone.'),
      default: true,
    }])
    if (!confirm) return
    try {
      await adapter.commitTransaction()
      console.log(theme.success('\n  ✓ Transaction committed.\n'))
    } catch (err: any) {
      console.log(theme.error(`\n  COMMIT failed: ${err.message}\n`))
    }
  }

  if (action === 'rollback') {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm', name: 'confirm',
      message: theme.error('ROLLBACK and discard all changes?'),
      default: false,
    }])
    if (!confirm) return
    try {
      await adapter.rollbackTransaction()
      console.log(theme.warn('\n  ↩ Transaction rolled back.\n'))
    } catch (err: any) {
      console.log(theme.error(`\n  ROLLBACK failed: ${err.message}\n`))
    }
  }
}
