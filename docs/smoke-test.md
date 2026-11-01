# Browser smoke test

The owner runs this checklist by hand. It checks the app and the SDK in a real browser, with a real wallet, on testnet.

Before you start:

- Run it on a UTC day from 1 to 28. A Spend & Save withdrawal only works on the withdrawal day, and that day can only be 1 to 28.
- Use a browser with Freighter set to testnet and a fresh test account.
- Copy each hash from the "This session" list in the app.

Record these:

- Date (UTC): 2026-11-01, 20:26 to 20:38 UTC
- Browser and version: Chrome 156.0.8078.79 (Official Build) (64-bit)
- Freighter (now Varial) version: Version 5.51.0

| Step | Action                                                                                                                                 | Hash                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1    | Connect the wallet.                                                                                                                    |                                                                  |
| 2    | Get test XLM.                                                                                                                          |                                                                  |
| 3    | Add the USDC trustline.                                                                                                                |                                                                  |
| 4    | Get at least 10 test USDC from the faucet.                                                                                             |                                                                  |
| 5    | Create goal A: target 5 USDC, deposit 1 USDC, cadence 1 day, deadline 7 days ahead, penalty 500 basis points. Note `renewBy` if shown. | 57c33a91515e0658f913cf14aa4e760ce03c136e133aacde07b5848ae22b3236 |
| 6    | Deposit 1 USDC into goal A by hand.                                                                                                    | beb2685d8557fa8e49f9e0ea5e26394770cb33b247ca267ebd3e8afa4d355882 |
| 7    | Check goal A's allowance status.                                                                                                       | a5c60fcd7b8dea282e6b1bf52c6a533d3423401acf6091f5f4e256c1aa98275a |
| 8    | Create goal B: target 2 USDC, deposit 1 USDC, cadence 1 day, deadline 3 days ahead, penalty 1,000 basis points.                        | cc98de15172bf33c3d380c57e8e38c369f8e822127b61354aeb41d2f726ae97b |
| 9    | Deposit 1 USDC into goal B.                                                                                                            | cd02b396d20ba977648cd31cf7797ca4c232a827a8cbbdcd76b5750207884710 |
| 10   | Preview goal B's withdrawal, then withdraw it. Note the penalty and fees shown.                                                        | de47540da9a76e49ba703437b2b4df9ccfe24a347bea6488a0cf2114d04d60e2 |
| 11   | Enrol in Spend & Save: 1,000 basis points, destination balance, withdrawal day set to today's UTC day.                                 | 0f60f5dc0d08d7ddf104307591a5a6a320fd4a41fcbe926cbd141bd3398d522c |
| 12   | Pay and save 2 USDC to `GCHOME3M4KSLKMW2QPWCFRCCKJDQBF6VKWU5JOFZMJV2QA6WYOA2TCDQ`. Note the amount saved.                              | 3d061183bcd5ef88dfeff3a618d11d450dcdcee7827de2e4728ce8b9110c4d4b |
| 13   | Check that the window shows as open today.                                                                                             |                                                                  |
| 14   | Withdraw 0.1 USDC from Spend & Save.                                                                                                   | 231050aefdc1b244e3d362ba92465cfa42c37e64f54e4e59ac0ce18cffb3146d |

Notes:

- Steps 1 to 4 were not run on a fresh account. This run used an existing test account, created on 2026-06-18, which already had XLM, the USDC trustline and test USDC. So those steps have no hash, and getting XLM, adding the trustline and using the faucet were not tested.
- Step 5: `renewBy` was not noted.
- Step 7: the app sent an allowance approval of 4 USDC, which is goal A's target less the deposit in step 6.
- Step 10: the withdrawal preview's figures were not noted. The figures noted at the time came from the create form, which shows an early withdrawal of the whole 2 USDC target: 1.79 USDC to the user, 0.2 USDC penalty, 0 USDC Loktin fee and 0.01 USDC integrator fee. The withdrawal itself was of the 1 USDC in the goal: 0.895 USDC to the user, 0.1 USDC penalty, 0 USDC Loktin fee and 0.005 USDC integrator fee.
- Step 12: the amount saved was 0.2 USDC.
- Step 13: no transaction. The withdrawal in step 14 only works inside the window.
- Step 14: 0.0995 USDC to the user and 0.0005 USDC integrator fee.

Afterwards:

- Goal A stays open, so the Evidence keeper collects its next deposit the following day.
- Every hash gets checked on chain.
