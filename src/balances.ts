import { HORIZON_URL, USDC } from './config';

export type Balances =
  | { readonly exists: false }
  | {
      readonly exists: true;
      readonly xlm: string;
      /** Undefined when the account has no USDC trustline. */
      readonly usdc: string | undefined;
    };

interface HorizonBalance {
  readonly asset_type: string;
  readonly asset_code?: string;
  readonly asset_issuer?: string;
  readonly balance: string;
}

export async function fetchBalances(address: string): Promise<Balances> {
  const response = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (response.status === 404) return { exists: false };
  if (!response.ok) {
    throw new Error(`Horizon answered with status ${response.status}.`);
  }
  const { balances } = (await response.json()) as {
    balances: HorizonBalance[];
  };
  const xlm = balances.find(({ asset_type }) => asset_type === 'native');
  const usdc = balances.find(
    ({ asset_code, asset_issuer }) =>
      asset_code === USDC.getCode() && asset_issuer === USDC.getIssuer(),
  );
  return { exists: true, xlm: xlm?.balance ?? '0', usdc: usdc?.balance };
}
