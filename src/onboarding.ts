import { PendingError, TransactionFailedError } from '@loktin/sdk';
import {
  BASE_FEE,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk/base';
import { Api, Server } from '@stellar/stellar-sdk/rpc';
import type { Balances } from './balances';
import { FRIENDBOT_URL, TESTNET, USDC, USDC_FAUCET_URL } from './config';
import { recordedWrite, type Write } from './session';
import { link, showError } from './ui';
import { signer } from './wallet';

const POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 1000;

async function addTrustline(address: string): Promise<Write> {
  const server = new Server(TESTNET.rpcUrl);
  const account = await server.getAccount(address);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: TESTNET.passphrase,
  })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .setTimeout(180)
    .build();

  const { signedTxXdr } = await signer.signTransaction(transaction.toXDR());
  const sent = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedTxXdr, TESTNET.passphrase),
  );
  if (sent.status !== 'PENDING') {
    throw new Error(
      `The network did not accept the trustline: ${sent.status}.`,
    );
  }

  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    const result = await server.getTransaction(sent.hash);
    if (result.status === Api.GetTransactionStatus.SUCCESS) {
      return { hash: sent.hash, ledger: result.ledger };
    }
    if (result.status === Api.GetTransactionStatus.FAILED) {
      throw new TransactionFailedError(sent.hash, undefined, undefined);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new PendingError(sent.hash, undefined);
}

function friendbotStep(address: string): HTMLElement[] {
  const url = new URL(FRIENDBOT_URL);
  url.searchParams.set('addr', address);
  const text = document.createElement('p');
  text.textContent = 'Your account needs test XLM before it can do anything.';
  const paragraph = document.createElement('p');
  paragraph.append(link('Get test XLM', url.href));
  return [text, paragraph];
}

function trustlineStep(address: string, onDone: () => void): HTMLElement[] {
  const text = document.createElement('p');
  text.textContent = 'Your account needs a trustline to hold USDC.';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Add the USDC trustline';
  const error = document.createElement('p');
  error.className = 'error';
  error.role = 'alert';
  error.hidden = true;
  button.addEventListener('click', () => {
    button.disabled = true;
    showError(error, undefined);
    recordedWrite('Add the USDC trustline', () => addTrustline(address))
      .then(onDone)
      .catch((cause: unknown) => showError(error, cause))
      .finally(() => {
        button.disabled = false;
      });
  });
  return [text, button, error];
}

function faucetStep(): HTMLElement[] {
  const text = document.createElement('p');
  text.textContent =
    'Your USDC balance is zero. Pick Stellar testnet on the faucet and paste your address.';
  const paragraph = document.createElement('p');
  paragraph.append(link('Get test USDC', USDC_FAUCET_URL));
  return [text, paragraph];
}

/** Shows the one step the account needs next, or hides the section. */
export function renderOnboarding(
  section: HTMLElement,
  step: HTMLElement,
  address: string | undefined,
  balances: Balances | undefined,
  onDone: () => void,
): void {
  let content: HTMLElement[] = [];
  if (address && balances) {
    if (!balances.exists) content = friendbotStep(address);
    else if (balances.usdc === undefined)
      content = trustlineStep(address, onDone);
    else if (Number(balances.usdc) === 0) content = faucetStep();
  }
  step.replaceChildren(...content);
  section.hidden = content.length === 0;
}
