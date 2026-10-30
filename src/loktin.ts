import { createLoktin, type Loktin } from '@loktin/sdk';
import { SpendSave } from '@loktin/sdk/spend-save';
import { TargetSavings } from '@loktin/sdk/target-savings';
import { DEMO_INTEGRATOR, INTEGRATOR_FEE_BPS } from './config';
import { signer } from './wallet';

export interface LoktinApp {
  readonly loktin: Loktin;
  readonly targetSavings: TargetSavings;
  readonly spendSave: SpendSave;
}

/** Read-only without a `publicKey`, able to write with one. */
export function createApp(publicKey?: string): LoktinApp {
  const loktin = createLoktin(
    publicKey
      ? { network: 'testnet', publicKey, signer }
      : { network: 'testnet' },
  );
  const integrator = {
    integrator: DEMO_INTEGRATOR,
    integratorFeeBps: INTEGRATOR_FEE_BPS,
  };
  return {
    loktin,
    targetSavings: new TargetSavings(loktin, integrator),
    spendSave: new SpendSave(loktin, integrator),
  };
}
