import { PendingError, TransactionFailedError } from '@loktin/sdk';
import { EXPLORER_URL } from './config';
import { element, link } from './ui';

export interface Write {
  readonly hash: string;
  readonly ledger: number;
}

function hashLink(hash: string): HTMLAnchorElement {
  return link(hash, `${EXPLORER_URL}/tx/${hash}`);
}

function addEntry(label: string, hash: string, outcome: string): void {
  const entry = document.createElement('li');
  entry.append(`${label}: `, hashLink(hash), `, ${outcome}`);
  element('session-list').append(entry);
  element('session-list').hidden = false;
  element('session-empty').hidden = true;
}

/** Runs a write and adds it to the session list, also when it fails or stays pending. */
export async function recordedWrite<T extends Write>(
  label: string,
  write: () => Promise<T>,
): Promise<T> {
  try {
    const result = await write();
    addEntry(label, result.hash, `ledger ${result.ledger}`);
    return result;
  } catch (error) {
    if (
      error instanceof PendingError ||
      error instanceof TransactionFailedError
    ) {
      addEntry(label, error.hash, error.code);
    }
    throw error;
  }
}

/** The hash, linked to the explorer, and the ledger of a write. */
export function writeLine({ hash, ledger }: Write): HTMLElement {
  const line = document.createElement('p');
  line.append('Transaction ', hashLink(hash), `, ledger ${ledger}`);
  return line;
}
