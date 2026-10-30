import {
  ContractError,
  fromBaseUnits,
  toBaseUnits,
  windowInTimeZone,
} from '@loktin/sdk';
import type { EnrollInput, EnrollmentView } from '@loktin/sdk/spend-save';
import type { Goal } from '@loktin/sdk/target-savings';
import type { LoktinApp } from './loktin';
import { recordedWrite, writeLine } from './session';
import {
  details,
  element,
  field,
  onClick,
  onSubmit,
  paragraph,
  showError,
  usdc,
} from './ui';

interface Options {
  readonly getApp: () => LoktinApp;
  readonly refreshBalances: () => void;
  readonly refreshGoals: () => Promise<void>;
}

function optionalUnits(id: string): bigint | undefined {
  const { value } = field(id);
  return value ? toBaseUnits(value) : undefined;
}

function skimText({ skim }: EnrollmentView): string {
  const parts = [];
  if (skim.percentBps !== undefined) {
    parts.push(`${skim.percentBps} basis points`);
  }
  if (skim.roundUpUnit !== undefined) {
    parts.push(`round up to ${usdc(skim.roundUpUnit)}`);
  }
  return parts.join(', ');
}

/** Clears a preview and locks its submit button when the amount changes. */
function resetOnInput(form: string, preview: string, submit: string): void {
  element(form).addEventListener('input', () => {
    element(preview).replaceChildren();
    (element(submit) as HTMLButtonElement).disabled = true;
  });
}

export function setupSpendSave({
  getApp,
  refreshBalances,
  refreshGoals,
}: Options) {
  let enrolled = false;
  let latestLoad = 0;
  let goals: readonly Goal[] = [];
  let destination = 'balance';

  function renderDestinations(): void {
    const select = element('enrol-destination') as HTMLSelectElement;
    const ids = goals.map(({ id }) => String(id));
    if (destination !== 'balance' && !ids.includes(destination)) {
      ids.push(destination);
    }
    const options = ids.map((id) => {
      const open = goals.some((goal) => String(goal.id) === id);
      return new Option(`Goal ${id}${open ? '' : ' (not open)'}`, id);
    });
    select.replaceChildren(
      new Option('Spend & Save balance', 'balance'),
      ...options,
    );
    select.value = destination;
  }

  function renderStatus(enrollment: EnrollmentView | undefined): void {
    enrolled = enrollment !== undefined;
    const pending = enrollment?.pendingDay;
    element('spend-status').replaceChildren(
      enrollment
        ? details([
            ['Balance', usdc(enrollment.principal)],
            ['Skim', skimText(enrollment)],
            [
              'Monthly cap',
              enrollment.monthlyCap === undefined
                ? 'None'
                : usdc(enrollment.monthlyCap),
            ],
            [
              'Destination',
              enrollment.destination.kind === 'goal'
                ? `Goal ${enrollment.destination.goalId}`
                : 'Spend & Save balance',
            ],
            ['Withdrawal day', String(enrollment.effectiveWithdrawalDay)],
            ...(pending
              ? ([['New withdrawal day', String(pending.day)]] as const)
              : []),
            ['Saved this month', usdc(enrollment.savedThisMonth)],
            ['Total saved', usdc(enrollment.totalSaved)],
          ])
        : paragraph('You are not enrolled in Spend & Save.'),
    );
    element('spend-enrolled').hidden = !enrollment;
    element('spend-close').hidden = enrollment?.principal !== 0n;
    element('enrol-day-hint').hidden = !enrollment;
    const title = enrollment ? 'Change settings' : 'Enrol';
    element('enrol-heading').textContent = title;
    element('enrol-submit').textContent = enrollment ? 'Save settings' : title;
  }

  function fillForm(enrollment: EnrollmentView): void {
    const { skim, monthlyCap, pendingDay, withdrawalDay } = enrollment;
    field('enrol-percent').value = skim.percentBps?.toString() ?? '';
    field('enrol-round-up').value =
      skim.roundUpUnit === undefined ? '' : fromBaseUnits(skim.roundUpUnit);
    field('enrol-cap').value =
      monthlyCap === undefined ? '' : fromBaseUnits(monthlyCap);
    field('enrol-day').value = String(pendingDay?.day ?? withdrawalDay);
    destination =
      enrollment.destination.kind === 'goal'
        ? String(enrollment.destination.goalId)
        : 'balance';
    renderDestinations();
  }

  async function renderWindow(): Promise<void> {
    const next = await getApp().spendSave.nextWindow();
    const local = windowInTimeZone(next);
    const now = Date.now();
    const open = now >= next.start.getTime() && now < next.end.getTime();
    element('spend-window').replaceChildren(
      paragraph(open ? 'The window is open now.' : 'The window is closed.'),
      details([
        ['Opens (UTC)', next.start.toUTCString()],
        ['Closes (UTC)', next.end.toUTCString()],
        [`Opens (${local.timeZone})`, local.start],
        [`Closes (${local.timeZone})`, local.end],
      ]),
    );
  }

  async function readEnrollment(): Promise<EnrollmentView | undefined> {
    try {
      return await getApp().spendSave.enrollment();
    } catch (cause) {
      if (
        cause instanceof ContractError &&
        cause.errorName === 'EnrollmentNotFound'
      ) {
        return undefined;
      }
      throw cause;
    }
  }

  /** Reads the enrolment and renders the status. Failures show in the section. */
  async function load(): Promise<void> {
    const request = ++latestLoad;
    const error = element('spend-error');
    showError(error, undefined);
    try {
      const enrollment = await readEnrollment();
      if (request !== latestLoad) return;
      renderStatus(enrollment);
      if (enrollment) {
        fillForm(enrollment);
        await renderWindow();
      }
    } catch (cause) {
      if (request === latestLoad) showError(error, cause);
    }
  }

  async function afterWrite(): Promise<void> {
    await load();
    refreshBalances();
  }

  function readSettings(): EnrollInput {
    const percent = field('enrol-percent').value;
    const selected = field('enrol-destination').value;
    return {
      skim: {
        percentBps: percent ? Number(percent) : undefined,
        roundUpUnit: optionalUnits('enrol-round-up'),
      },
      monthlyCap: optionalUnits('enrol-cap'),
      destination:
        selected === 'balance'
          ? { kind: 'balance' }
          : { kind: 'goal', goalId: BigInt(selected) },
      withdrawalDay: Number(field('enrol-day').value),
    };
  }

  element('spend-refresh').addEventListener('click', () => void load());
  resetOnInput('pay-form', 'pay-preview-result', 'pay-submit');
  resetOnInput('withdraw-form', 'withdraw-preview-result', 'withdraw-submit');

  onSubmit(element('enrol-form'), element('enrol-error'), async () => {
    const input = readSettings();
    const { spendSave } = getApp();
    const write = await recordedWrite(
      enrolled ? 'Change Spend & Save settings' : 'Enrol in Spend & Save',
      () =>
        enrolled ? spendSave.updateSettings(input) : spendSave.enroll(input),
    );
    element('enrol-result').replaceChildren(writeLine(write));
    await afterWrite();
  });

  onClick(element('pay-preview'), element('pay-error'), async () => {
    const units = toBaseUnits(field('pay-amount').value);
    const preview = await getApp().spendSave.previewSkim(units);
    element('pay-preview-result').replaceChildren(
      details([
        ['Spend', usdc(preview.spent)],
        ['Percentage part', usdc(preview.percentPart)],
        ['Round-up part', usdc(preview.roundUpPart)],
        ['Skim', usdc(preview.skim)],
        ['Trimmed by the cap', usdc(preview.capTrimmed)],
        ['Skim after the cap', usdc(preview.capped)],
      ]),
    );
    (element('pay-submit') as HTMLButtonElement).disabled = false;
  });

  onSubmit(element('pay-form'), element('pay-error'), async () => {
    const units = toBaseUnits(field('pay-amount').value);
    const { spendSave } = getApp();
    const write = await recordedWrite('Pay and save', () =>
      spendSave.payAndSave(field('pay-to').value, units),
    );
    const saving = write.result;
    element('pay-result').replaceChildren(
      details([
        ['Skim', usdc(saving.skim)],
        ['Trimmed by the cap', usdc(saving.capTrimmed)],
        ['Not covered by the wallet', usdc(saving.shortfall)],
        ['Saved to the balance', usdc(saving.toBalance)],
        ['Saved to a goal', usdc(saving.toGoal)],
        ...(saving.goalId === undefined
          ? []
          : ([['Goal', String(saving.goalId)]] as const)),
      ]),
      writeLine(write),
    );
    await refreshGoals();
    await afterWrite();
  });

  onClick(element('withdraw-preview'), element('withdraw-error'), async () => {
    const units = toBaseUnits(field('withdraw-amount').value);
    const preview = await getApp().spendSave.previewWithdraw(units);
    element('withdraw-preview-result').replaceChildren(
      details([
        ['Amount', usdc(preview.amount)],
        ['You receive', usdc(preview.toUser)],
        ['Loktin fee', usdc(preview.loktinFee)],
        ['Integrator fee', usdc(preview.integratorFee)],
      ]),
    );
    (element('withdraw-submit') as HTMLButtonElement).disabled = false;
  });

  onSubmit(element('withdraw-form'), element('withdraw-error'), async () => {
    const units = toBaseUnits(field('withdraw-amount').value);
    const message = `Withdraw ${usdc(units)}? Check the split above first.`;
    if (!window.confirm(message)) return;
    const { spendSave } = getApp();
    const write = await recordedWrite('Withdraw from Spend & Save', () =>
      spendSave.withdraw(units),
    );
    element('withdraw-result').replaceChildren(
      paragraph(`Paid ${usdc(write.result.toUser)}.`),
      writeLine(write),
    );
    await afterWrite();
  });

  onClick(element('close-submit'), element('close-error'), async () => {
    const { spendSave } = getApp();
    const write = await recordedWrite('Close Spend & Save', () =>
      spendSave.close(),
    );
    element('enrol-result').replaceChildren(writeLine(write));
    await afterWrite();
  });

  return {
    load,
    setGoals(next: readonly Goal[]): void {
      goals = next;
      destination = field('enrol-destination').value || destination;
      renderDestinations();
    },
  };
}
