import type { LoktinSigner } from '@loktin/sdk';
import {
  KitEventType,
  Networks,
  StellarWalletsKit,
} from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { TESTNET } from './config';

/** Puts the wallet button in `button` and reports each address change. */
export async function initWallet(
  button: HTMLElement,
  onAddress: (address: string | undefined) => void,
): Promise<void> {
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
  });
  StellarWalletsKit.on(KitEventType.STATE_UPDATED, ({ payload }) =>
    onAddress(payload.address),
  );
  StellarWalletsKit.on(KitEventType.DISCONNECT, () => onAddress(undefined));
  await StellarWalletsKit.createButton(button);
}

/** The SDK signer. All signing happens in the wallet. */
export const signer: LoktinSigner = {
  signTransaction: async (xdr) => {
    const { address } = await StellarWalletsKit.getAddress();
    return StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: TESTNET.passphrase,
      address,
    });
  },
};
