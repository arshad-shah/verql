// Structured DB / app error copy, keyed by the DbErrorCode in
// src/renderer/src/lib/db-error.ts. Each code mirrors the { title, message, hint }
// shape. Where a message has a "detailed" and a "generic" form (depending on
// whether a regex captured a name), both variants live here as `message` and
// `messageGeneric`. Dynamic captures (column/table/constraint names) are passed
// as `{name}` interpolation vars from the call site.
//
// Query-semantic codes describe their concepts with driver-supplied NOUNS —
// `{object}`/`{field}`/`{record}` (+ plural and Title-cased `{Object}`/… forms)
// — interpolated by db-error.ts from the active driver's `nouns` capability, so
// a Mongo/Redis error reads "collection"/"document"/"key" instead of SQL terms.
export const errors = {
  COLUMN_NOT_FOUND: {
    title: '{Field} not found',
    message: "The {field} `{name}` doesn't exist in any of the {objects} in this query.",
    hint: "Check the spelling, confirm the {field} belongs to a {object} you've referenced, and that you're using the right alias if {fields} share names."
  },
  TABLE_NOT_FOUND: {
    title: '{Object} not found',
    message: "The {object} `{name}` doesn't exist in the active schema.",
    hint: 'Verify the {object} name and the schema/database selector at the top of the tab.'
  },
  SCHEMA_NOT_FOUND: {
    title: 'Schema not found',
    message: "The schema `{name}` doesn't exist on this connection.",
    hint: 'Pick a schema from the selector, or check that you connected to the right database.'
  },
  SYNTAX_ERROR: {
    title: 'Syntax error',
    message: 'The parser choked near `{token}`.',
    messageGeneric: "The parser couldn't make sense of this query.",
    hint: 'Look just before the highlighted token — most syntax errors come from the line above, not the line reported.'
  },
  PERMISSION_DENIED: {
    title: 'Permission denied',
    message: "Your database user isn't allowed to run this query.",
    hint: 'Use an account with the required privileges, or grant them to this user.'
  },
  AUTH_FAILED: {
    title: 'Authentication failed',
    message: 'The database refused the credentials for this connection.',
    hint: 'Re-enter the password in the connection editor, or check that the user still exists.'
  },
  CONNECTION_REFUSED: {
    title: "Can't reach the database",
    message: 'No database is listening at the configured host and port.',
    hint: "Confirm the host/port, the database is running, and a firewall isn't blocking the connection."
  },
  CONNECTION_LOST: {
    title: 'Connection lost',
    message: 'The database closed the connection unexpectedly.',
    hint: "Reconnect from the connection picker. If this keeps happening, check the server's idle-timeout / max-connections settings."
  },
  TIMEOUT: {
    title: 'Query timed out',
    message: 'The query ran longer than the configured timeout.',
    hint: 'Increase the query timeout in Settings → General, or return less data (filter the results or fetch fewer records).'
  },
  QUERY_CANCELLED: {
    title: 'Query cancelled',
    message: 'You cancelled this query before it finished.'
  },
  UNIQUE_VIOLATION: {
    title: 'Duplicate value',
    message: 'A {record} with this value already exists (constraint `{constraint}`).',
    messageGeneric: 'A {record} with this value already exists.',
    hint: 'Use a different unique value, or update the existing {record} instead of inserting.'
  },
  NOT_NULL_VIOLATION: {
    title: 'Required {field} missing',
    message: '{Field} `{column}` is required but no value was provided.',
    messageGeneric: 'A required {field} is missing a value.'
  },
  FOREIGN_KEY_VIOLATION: {
    title: 'Foreign key constraint failed',
    message:
      "A referenced {record} in another {object} doesn't exist (or you're deleting a {record} that other {objects} still point to).",
    hint: 'Insert the parent {record} first, or remove the referencing {records} before deleting.'
  },
  CHECK_VIOLATION: {
    title: 'Check constraint failed',
    message: 'A {field} value violates a CHECK constraint defined on the {object}.'
  },
  TYPE_MISMATCH: {
    title: 'Type mismatch',
    message: "A value doesn't match the {field}'s declared type.",
    hint: 'Cast or convert the value explicitly, or fix the input — quoted numbers, malformed dates, and a missing value where one is required are the usual culprits.'
  },
  DIVISION_BY_ZERO: {
    title: 'Division by zero',
    message: 'Something in the query divided by zero.',
    hint: 'Guard the denominator so it can never be zero (skip or substitute zero values).'
  },
  DEADLOCK: {
    title: 'Deadlock',
    message: 'Two transactions blocked each other and the database aborted one of them.',
    hint: 'Retry the query — deadlocks are usually transient.'
  },
  TRANSACTION_ABORTED: {
    title: 'Transaction aborted',
    message: 'An earlier statement in this transaction failed and the whole transaction is now poisoned.',
    hint: 'Roll back the transaction to clear it, then re-run your statements.'
  },
  DUPLICATE_TABLE: {
    title: '{Object} already exists',
    message: 'A {object} named `{name}` already exists.',
    messageGeneric: 'A {object} with that name already exists.',
    hint: 'Use a create-if-not-exists form, or remove the existing {object} first.'
  },
  KEYRING_DECRYPT_FAILED: {
    title: "Couldn't unlock saved credentials",
    message: 'The OS keychain refused to decrypt the credentials Verql has on file.',
    hint: 'Open the connection or AI provider settings and re-enter the password / API key.'
  },
  AI_KEY_MISSING: {
    title: 'AI provider not configured',
    message: 'No API key is configured for the selected AI provider.',
    hint: 'Open Settings → AI and paste your provider key, then try again.'
  },
  AI_RATE_LIMITED: {
    title: 'AI rate limit hit',
    message: 'The AI provider is rate-limiting requests from your key.',
    hint: 'Wait a few seconds and retry, or switch to a different provider/model in Settings → AI.'
  },
  AI_QUOTA_EXCEEDED: {
    title: 'AI quota exhausted',
    message: 'Your AI provider account is out of credits.',
    hint: 'Top up at the provider dashboard, or switch providers in Settings → AI.'
  },
  AI_PROVIDER_ERROR: {
    title: 'AI provider error',
    message: 'The AI provider returned an error.',
    hint: 'Try again in a moment, or switch models if the error persists.'
  },
  NETWORK_ERROR: {
    title: 'Network error',
    message: "Couldn't reach the remote service over the network.",
    hint: "Check your internet connection. If you're behind a VPN or proxy, verify it's configured."
  },
  FILE_NOT_FOUND: {
    title: 'File not found',
    message: "The file Verql tried to open isn't at that path anymore.",
    hint: 'Confirm the file still exists and you have read access to it.'
  },
  UNKNOWN: {
    title: 'Something went wrong'
  }
} as const
