# Loktin SDK example

A small web app that shows how an integrator uses the Loktin SDK, [`@loktin/sdk`](https://github.com/Lokt-In/loktin-sdk). It runs on Stellar testnet only. Test assets have no value.

The app shows how to:

- connect a wallet through Stellar Wallets Kit;
- read XLM and USDC balances;
- take a new account through test XLM, the USDC trustline and test USDC;
- create Target Savings goals, deposit, manage the allowance, and preview and withdraw;
- enrol in Spend & Save, pay and save, read the withdrawal window, and preview and withdraw;
- list every transaction of the session, with its hash and ledger.

The browser smoke checklist is in [docs/smoke-test.md](docs/smoke-test.md).

The app never handles a secret key. All signing happens in the wallet.

## Run it locally

You need Node 22.12 or later. CI uses Node 24.

```sh
npm ci
npm run dev
```

## Wallet kit audit findings

`npm audit` reports 29 issues, 11 of them high. All of them come through Stellar Wallets Kit's WalletConnect/Reown, HOT Wallet (NEAR, Solana) and Coinbase dependencies.

The app does not load those modules. It uses the kit's `defaultModules()`, which has no WalletConnect, HOT, Ledger or Trezor module, so that code is installed but not shipped.

`scripts/check-bundle.mjs` enforces this. It runs at the end of `npm run build`, reads every file in `dist/assets`, and fails the build if it finds one of those packages' names.

The kit comes from JSR, installed under its npm name, because its MetaMask module imports it by that name.

## Links

- [SDK documentation](https://docs.loktin.xyz/sdk/)
- [SDK repo](https://github.com/Lokt-In/loktin-sdk)

## Licence

Apache-2.0. See [LICENSE](LICENSE).
