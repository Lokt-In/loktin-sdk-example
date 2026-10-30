import { TESTNET } from '@loktin/sdk';
import { Asset } from '@stellar/stellar-sdk/base';

export { TESTNET };

export const DEMO_INTEGRATOR =
  'GC7MLNIIOOX6RKBL3GFTYNGXWC6AQVGFKY2GPMZI3BYZYC37C7GJOOWP';
export const INTEGRATOR_FEE_BPS = 50;

export const USDC = new Asset(
  'USDC',
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
);

export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const FRIENDBOT_URL = 'https://friendbot.stellar.org/';
export const USDC_FAUCET_URL = 'https://faucet.circle.com';
export const EXPLORER_URL = 'https://stellar.expert/explorer/testnet';
