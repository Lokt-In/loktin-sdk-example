# Browser smoke test

The owner runs this checklist by hand. It checks the app and the SDK in a real browser, with a real wallet, on testnet.

Before you start:

- Run it on a UTC day from 1 to 28. A Spend & Save withdrawal only works on the withdrawal day, and that day can only be 1 to 28.
- Use a browser with Freighter set to testnet and a fresh test account.
- Copy each hash from the "This session" list in the app.

Record these:

- Date (UTC):
- Browser and version:
- Freighter version:

| Step | Action                                                                                                                                 | Hash |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1    | Connect the wallet.                                                                                                                    |      |
| 2    | Get test XLM.                                                                                                                          |      |
| 3    | Add the USDC trustline.                                                                                                                |      |
| 4    | Get at least 10 test USDC from the faucet.                                                                                             |      |
| 5    | Create goal A: target 5 USDC, deposit 1 USDC, cadence 1 day, deadline 7 days ahead, penalty 500 basis points. Note `renewBy` if shown. |      |
| 6    | Deposit 1 USDC into goal A by hand.                                                                                                    |      |
| 7    | Check goal A's allowance status.                                                                                                       |      |
| 8    | Create goal B: target 2 USDC, deposit 1 USDC, cadence 1 day, deadline 3 days ahead, penalty 1,000 basis points.                        |      |
| 9    | Deposit 1 USDC into goal B.                                                                                                            |      |
| 10   | Preview goal B's withdrawal, then withdraw it. Note the penalty and fees shown.                                                        |      |
| 11   | Enrol in Spend & Save: 1,000 basis points, destination balance, withdrawal day set to today's UTC day.                                 |      |
| 12   | Pay and save 2 USDC to `GCHOME3M4KSLKMW2QPWCFRCCKJDQBF6VKWU5JOFZMJV2QA6WYOA2TCDQ`. Note the amount saved.                              |      |
| 13   | Check that the window shows as open today.                                                                                             |      |
| 14   | Withdraw 0.1 USDC from Spend & Save.                                                                                                   |      |

Afterwards:

- Goal A stays open, so the Evidence keeper collects its next deposit the following day.
- Every hash gets checked on chain.
