import { toBaseUnits } from '@loktin/sdk';
import {
  creationBreakdown,
  type Goal,
  type WithdrawalRule,
} from '@loktin/sdk/target-savings';
import { INTEGRATOR_FEE_BPS } from './config';
import type { LoktinApp } from './loktin';
import { recordedWrite, writeLine } from './session';
import {
  details,
  element,
  errorParagraph,
  field,
  onClick,
  onSubmit,
  paragraph,
  showError,
  usdc,
} from './ui';

const SECONDS_PER_DAY = 86400;

interface Options {
  readonly getApp: () => LoktinApp;
  readonly refreshBalances: () => void;
  readonly onGoals: (goals: readonly Goal[]) => void;
}

function button(text: string): HTMLButtonElement {
  const created = document.createElement('button');
  created.type = 'button';
  created.textContent = text;
  return created;
}

function ruleText(rule: WithdrawalRule): string {
  return rule.kind === 'lock' ? 'Lock' : `Penalty, ${rule.bps} basis points`;
}

function readRule(): WithdrawalRule {
  return field('goal-rule').value === 'lock'
    ? { kind: 'lock' }
    : { kind: 'penalty', bps: Number(field('goal-penalty').value) };
}

export function setupTargetSavings({
  getApp,
  refreshBalances,
  onGoals,
}: Options) {
  let loktinFeeBps: number | undefined;
  let latestLoad = 0;

  function renderBreakdown(): void {
    const output = element('goal-breakdown');
    const target = field('goal-target').value;
    if (!target || loktinFeeBps === undefined) {
      output.replaceChildren();
      return;
    }
    try {
      const split = creationBreakdown({
        target: toBaseUnits(target),
        rule: readRule(),
        loktinFeeBps,
        integratorFeeBps: INTEGRATOR_FEE_BPS,
      });
      output.replaceChildren(
        paragraph(
          split.locked
            ? 'A lock rule has no early withdrawal. Once the target is reached or the deadline passes, fees still apply:'
            : 'An early withdrawal of the whole target would pay out:',
        ),
        details([
          ['You receive', usdc(split.toUser)],
          ['Penalty', usdc(split.penalty)],
          ['Loktin fee', usdc(split.loktinFee)],
          ['Integrator fee', usdc(split.integratorFee)],
        ]),
      );
    } catch (cause) {
      const error = errorParagraph();
      showError(error, cause);
      output.replaceChildren(error);
    }
  }

  function renderRuleFields(): void {
    const lock = field('goal-rule').value === 'lock';
    element('goal-penalty-field').hidden = lock;
    field('goal-penalty').disabled = lock;
    element('goal-lock-hint').hidden = !lock;
  }

  async function afterWrite(): Promise<void> {
    await load();
    refreshBalances();
  }

  function goalCard(goal: Goal): HTMLElement {
    const card = document.createElement('article');
    card.className = 'goal';
    const error = errorParagraph();
    const allowance = paragraph('Allowance: loading...');
    const amount = document.createElement('input');
    amount.inputMode = 'decimal';
    amount.ariaLabel = `Deposit amount for goal ${goal.id}, in USDC`;
    amount.placeholder = 'Amount (USDC)';
    const deposit = button('Deposit');
    const renew = button('Renew allowance');
    const preview = button('Preview withdrawal');
    const split = document.createElement('div');
    const withdraw = button('Withdraw');
    withdraw.hidden = true;

    onClick(deposit, error, async () => {
      const units = toBaseUnits(amount.value);
      const { targetSavings } = getApp();
      const write = await recordedWrite(`Deposit into goal ${goal.id}`, () =>
        targetSavings.deposit(goal.id, units),
      );
      element('goals-result').replaceChildren(
        paragraph(`Deposited ${usdc(units)} into goal ${goal.id}.`),
        writeLine(write),
      );
      await afterWrite();
    });

    onClick(renew, error, async () => {
      const { targetSavings } = getApp();
      const write = await recordedWrite(
        `Renew allowance for goal ${goal.id}`,
        () => targetSavings.renewAllowance(goal.id),
      );
      const { renewBy } = write.allowance;
      element('goals-result').replaceChildren(
        paragraph(`Allowance set to ${usdc(write.allowance.amount)}.`),
        writeLine(write),
        ...(renewBy ? [paragraph(`Renew by ${renewBy.toUTCString()}.`)] : []),
      );
      await afterWrite();
    });

    onClick(preview, error, async () => {
      const result = await getApp().targetSavings.previewWithdraw(goal.id);
      split.replaceChildren(
        details([
          ['Amount', usdc(result.amount)],
          ['You receive', usdc(result.toUser)],
          ['Penalty', usdc(result.penalty)],
          ['Loktin fee', usdc(result.loktinFee)],
          ['Integrator fee', usdc(result.integratorFee)],
        ]),
      );
      withdraw.hidden = false;
    });

    onClick(withdraw, error, async () => {
      const message = `Withdraw goal ${goal.id} and close it? Check the split above first.`;
      if (!window.confirm(message)) return;
      const { targetSavings } = getApp();
      const write = await recordedWrite(`Withdraw goal ${goal.id}`, () =>
        targetSavings.withdraw(goal.id),
      );
      element('goals-result').replaceChildren(
        paragraph(`Goal ${goal.id} paid ${usdc(write.result.toUser)}.`),
        writeLine(write),
      );
      await afterWrite();
    });

    card.append(
      details([
        ['Goal id', String(goal.id)],
        ['Principal', usdc(goal.principal)],
        ['Target', usdc(goal.target)],
        ['Deadline', goal.deadline.toUTCString()],
        ['Cadence', `${goal.cadenceSeconds / SECONDS_PER_DAY} days`],
        ['Rule', ruleText(goal.rule)],
      ]),
      allowance,
      amount,
      deposit,
      renew,
      preview,
      split,
      withdraw,
      error,
    );

    getApp()
      .targetSavings.allowanceStatus(goal.id)
      .then((status) => {
        const short = status.short ? ' It is short: renew the allowance.' : '';
        allowance.textContent = `Allowance: ${usdc(status.allowance)} left, next collection ${usdc(status.nextAmount)}.${short}`;
      })
      .catch((cause: unknown) => {
        allowance.textContent = 'Allowance: not available.';
        showError(error, cause);
      });
    return card;
  }

  async function loadRates(): Promise<void> {
    const { targetSavings } = getApp();
    const [feeBps, minCadence] = await Promise.all([
      targetSavings.loktinFeeBps(),
      targetSavings.minCadence(),
    ]);
    loktinFeeBps = feeBps;
    const days = Math.ceil(minCadence / SECONDS_PER_DAY);
    field('goal-cadence').min = String(days);
    const hint = element('goal-cadence-hint');
    hint.textContent = `The shortest cadence is ${days} ${days === 1 ? 'day' : 'days'}.`;
    hint.hidden = false;
    renderBreakdown();
  }

  /** Reads the goals and renders the list. Failures show in the section. */
  async function load(): Promise<void> {
    const request = ++latestLoad;
    const error = element('goals-error');
    showError(error, undefined);
    try {
      const app = getApp();
      if (loktinFeeBps === undefined) await loadRates();
      const goals = await app.targetSavings.userGoals();
      if (request !== latestLoad) return;
      element('goals').replaceChildren(
        goals.length === 0
          ? paragraph('You have no open goals.')
          : paragraph(`${goals.length} of 20 open goals.`),
        ...goals.map(goalCard),
      );
      onGoals(goals);
    } catch (cause) {
      if (request === latestLoad) showError(error, cause);
    }
  }

  renderRuleFields();
  element('goal-rule').addEventListener('change', () => {
    renderRuleFields();
    renderBreakdown();
  });
  element('goal-form').addEventListener('input', renderBreakdown);
  element('goals-refresh').addEventListener('click', () => void load());

  onSubmit(element('goal-form'), element('goal-error'), async () => {
    const input = {
      target: toBaseUnits(field('goal-target').value),
      depositSize: toBaseUnits(field('goal-deposit').value),
      cadenceSeconds: Number(field('goal-cadence').value) * SECONDS_PER_DAY,
      deadline: new Date(`${field('goal-deadline').value}T00:00:00Z`),
      rule: readRule(),
    };
    const { targetSavings } = getApp();
    const goal = await recordedWrite('Create goal', () =>
      targetSavings.createGoal(input),
    );
    const renewBy = goal.allowance?.renewBy;
    element('goal-result').replaceChildren(
      paragraph(`Goal ${goal.result} created.`),
      writeLine(goal),
      ...(renewBy ? [paragraph(`Renew by ${renewBy.toUTCString()}.`)] : []),
    );
    await afterWrite();
  });

  return { load };
}
