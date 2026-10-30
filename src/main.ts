import { fetchBalances, type Balances } from './balances';
import { EXPLORER_URL, TESTNET } from './config';
import { createApp, type LoktinApp } from './loktin';
import { renderOnboarding } from './onboarding';
import { element, link, showError } from './ui';
import { setupSpendSave } from './spend-save';
import { setupTargetSavings } from './target-savings';
import { initWallet } from './wallet';

let app: LoktinApp | undefined;
let address: string | undefined;
let latestRefresh = 0;
let savingsFor: string | undefined;

function getApp(): LoktinApp {
  if (!app) throw new Error('The SDK did not start.');
  return app;
}

const spendSave = setupSpendSave({
  getApp,
  refreshBalances: () => void refresh(),
  refreshGoals: () => targetSavings.load(),
});
const targetSavings = setupTargetSavings({
  getApp,
  refreshBalances: () => void refresh(),
  onGoals: (goals) => spendSave.setGoals(goals),
});

/** Shows and loads the savings sections once per connected address. */
function showSavings(next: string | undefined): void {
  element('target-savings').hidden = !next;
  element('spend-save').hidden = !next;
  if (next === savingsFor) return;
  savingsFor = next;
  if (next) {
    void targetSavings.load();
    void spendSave.load();
  }
}

function renderBalances(balances: Balances | undefined): void {
  const message = element('account-message');
  element('balances').hidden = !balances?.exists;
  message.hidden = true;
  if (!address || !balances) return;

  if (!balances.exists) {
    message.textContent = 'This account does not exist on testnet yet.';
    message.hidden = false;
  } else {
    element('balance-xlm').textContent = balances.xlm;
    element('balance-usdc').textContent = balances.usdc ?? 'No trustline';
    if (balances.usdc === undefined) {
      message.textContent = 'This account has no USDC trustline yet.';
      message.hidden = false;
    }
  }
}

function render(balances: Balances | undefined): void {
  renderBalances(balances);
  renderOnboarding(
    element('onboarding'),
    element('onboarding-step'),
    address,
    balances,
    () => void refresh(),
  );
}

async function refresh(): Promise<void> {
  const current = address;
  const request = ++latestRefresh;
  const error = element('account-error');
  showError(error, undefined);
  try {
    const balances = current ? await fetchBalances(current) : undefined;
    if (request === latestRefresh) {
      render(balances);
      const ready = balances?.exists && balances.usdc !== undefined;
      showSavings(ready ? current : undefined);
    }
  } catch (cause) {
    if (request === latestRefresh) {
      render(undefined);
      showError(error, cause);
    }
  }
}

function onAddress(next: string | undefined): void {
  if (next === address && app) return;
  address = next;
  element('account-address').textContent =
    next ?? 'Connect a wallet to see your balances.';
  element('refresh').hidden = !next;
  showSavings(undefined);
  app = undefined;
  try {
    app = createApp(next);
  } catch (cause) {
    showError(element('wallet-error'), cause);
  }
  void refresh();
}

async function renderNetwork(): Promise<void> {
  const contracts = [
    ['network-target-savings', TESTNET.contracts.targetSavings],
    ['network-spend-save', TESTNET.contracts.spendSave],
  ] as const;
  element('network-passphrase').textContent = TESTNET.passphrase;
  for (const [id, contract] of contracts) {
    element(id).append(link(contract, `${EXPLORER_URL}/contract/${contract}`));
  }

  const minCadence = element('network-min-cadence');
  try {
    const seconds = await getApp().targetSavings.minCadence();
    minCadence.textContent = `${seconds} seconds`;
  } catch (cause) {
    minCadence.textContent = 'Not available';
    showError(element('network-error'), cause);
  }
}

element('refresh').addEventListener('click', () => void refresh());
onAddress(undefined);
void renderNetwork();
initWallet(element('wallet-button'), onAddress).catch((cause: unknown) =>
  showError(element('wallet-error'), cause),
);
