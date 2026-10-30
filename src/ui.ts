import { fromBaseUnits, LoktinError } from '@loktin/sdk';

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

export function field(id: string): HTMLInputElement {
  return element(id) as HTMLInputElement;
}

export function usdc(units: bigint): string {
  return `${fromBaseUnits(units)} USDC`;
}

export function paragraph(text: string, className?: string): HTMLElement {
  const created = document.createElement('p');
  created.textContent = text;
  if (className) created.className = className;
  return created;
}

export function errorParagraph(): HTMLElement {
  const created = paragraph('', 'error');
  created.role = 'alert';
  created.hidden = true;
  return created;
}

export function details(
  rows: readonly (readonly [string, string])[],
): HTMLElement {
  const list = document.createElement('dl');
  for (const [term, value] of rows) {
    const name = document.createElement('dt');
    name.textContent = term;
    const text = document.createElement('dd');
    text.textContent = value;
    list.append(name, text);
  }
  return list;
}

/** Runs `run` with `button` disabled. Any failure shows in `error`. */
export async function runAction(
  button: HTMLButtonElement,
  error: HTMLElement,
  run: () => Promise<void>,
): Promise<void> {
  button.disabled = true;
  showError(error, undefined);
  try {
    await run();
  } catch (cause) {
    showError(error, cause);
  } finally {
    button.disabled = false;
  }
}

export function onSubmit(
  form: HTMLElement,
  error: HTMLElement,
  run: () => Promise<void>,
): void {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );
    if (button) void runAction(button, error, run);
  });
}

export function onClick(
  button: HTMLElement,
  error: HTMLElement,
  run: () => Promise<void>,
): void {
  button.addEventListener('click', () => {
    void runAction(button as HTMLButtonElement, error, run);
  });
}
