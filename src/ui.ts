import { LoktinError } from '@loktin/sdk';

/** Plain text for any error: SDK errors with their code, wallet errors too. */
function errorText(error: unknown): string {
  if (error instanceof LoktinError) return `${error.code}: ${error.message}`;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return String(error);
}

/** Shows `error` in `element`, or clears it when `error` is undefined. */
export function showError(element: HTMLElement, error: unknown): void {
  element.textContent = error === undefined ? '' : errorText(error);
  element.hidden = error === undefined;
}

export function link(text: string, href: string): HTMLAnchorElement {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.textContent = text;
  anchor.target = '_blank';
  anchor.rel = 'noreferrer';
  return anchor;
}

export function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element: ${id}.`);
  return found;
}
