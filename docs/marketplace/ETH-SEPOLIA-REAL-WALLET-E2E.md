# Marketplace ETH Sepolia — Real Wallet E2E Runbook

Status: **manual testnet validation runbook**  
Network: **Ethereum Sepolia**  
Chain ID: **11155111**

This procedure validates the real browser-wallet-server-chain path without giving MyZubster or CI access to any user private key.

## Safety boundary

Never paste a MetaMask private key, seed phrase or mnemonic into MyZubster, GitHub Actions, a terminal, an issue, a pull request or this runbook.

The two wallets remain user-controlled. MetaMask performs the transaction signing locally.

Sepolia ETH is testnet-only and has no intended monetary settlement value in this flow.

## Preconditions

Before starting, verify all of the following:

- the wallet ownership changes are deployed;
- the signed Marketplace request flow is deployed;
- Seller-visible wallet evidence is deployed;
- the Sepolia payment lifecycle is deployed;
- production/deployment environment has `ETH_SEPOLIA_RPC_URL` configured;
- the GitHub repository has the `ETH_SEPOLIA_RPC_URL` Actions secret if the independent workflow will be used;
- Buyer and Seller are two distinct MyZubster accounts;
- Buyer and Seller each control a distinct MetaMask/EVM account;
- both EVM addresses are verified in MyZubster;
- Seller membership is active and accepts `ETH`;
- Buyer wallet has enough Sepolia test ETH for the payment and gas.

## Test topology

```text
Buyer MyZubster account
  -> verified Buyer MetaMask address
  -> Sepolia test ETH

Seller MyZubster account
  -> verified Seller MetaMask address
  -> ETH enabled in Seller preferences

Marketplace listing
  -> currency = ETH
  -> payment mode
```

Do not use the same wallet as both Buyer and Seller for the acceptance E2E.

## Step 1 — Seller creates an ETH listing

Sign in as the Seller and create a Marketplace listing priced directly in ETH.

For a smoke test, use a deliberately small Sepolia-only amount.

Record:

- listing ID;
- Seller MyZubster account;
- verified Seller wallet address.

## Step 2 — Buyer creates the signed request

Sign in as the Buyer.

Confirm that the currently selected MetaMask account is the same address already verified on the Buyer MyZubster account.

Open the ETH listing and create the Marketplace request.

Expected result:

```text
MarketplaceOrder.status = REQUESTED
walletEvidence.status = VERIFIED
payment.status != PAID
```

The MetaMask signature at this stage is an off-chain request signature. No ETH should move.

## Step 3 — Seller inspects and accepts

Sign in as the Seller and open Marketplace Operations.

Expected evidence panel:

```text
✓ Richiesta firmata · wallet verificato
```

Check that the displayed Buyer wallet and chain information correspond to the signed request.

Accept the request.

Expected result:

```text
MarketplaceOrder.status = ACCEPTED
```

Still no ETH has moved.

## Step 4 — Buyer creates the server-owned ETH payment intent

Return to the Buyer account and open Marketplace Operations.

Click:

```text
Paga ETH su Sepolia · testnet
```

MyZubster creates the payment intent before requesting the blockchain transaction.

Verify the displayed values:

- network: Sepolia;
- chain ID: 11155111;
- sender: verified Buyer wallet;
- recipient: verified Seller wallet;
- amount: exact order amount.

These values are authoritative from the server-owned order payment intent.

## Step 5 — MetaMask transaction

MyZubster requests the Buyer wallet account and checks the network.

If necessary, approve switching MetaMask to Ethereum Sepolia.

MetaMask should then show the actual transaction confirmation.

Verify in MetaMask:

- network is Ethereum Sepolia;
- destination is the Seller wallet;
- amount matches the payment intent.

Approve only after these values match.

Expected result:

```text
eth_sendTransaction
  -> Sepolia tx hash
  -> payment.status = CONFIRMING
```

A submitted transaction is not yet `PAID`.

## Step 6 — Server verification

MyZubster independently checks the transaction through its configured Sepolia RPC.

The verifier checks:

- transaction exists;
- receipt status is successful;
- `from` equals the frozen Buyer wallet;
- `to` equals the frozen Seller wallet;
- transaction value satisfies the frozen expected wei amount;
- minimum confirmation depth is reached.

The current requirement is:

```text
3 confirmations
```

If the transaction is correct but still shallow:

```text
payment.status = CONFIRMING
reason = INSUFFICIENT_CONFIRMATIONS
```

Use **Verifica conferme ETH** again after additional blocks.

## Step 7 — PAID evidence

After the required confirmations:

```text
payment.status = PAID
```

Marketplace Operations should show:

```text
✓ Pagamento ETH verificato
```

and may expose the Sepolia Etherscan transaction link.

Record:

- order ID;
- transaction hash;
- expected Buyer/sender address;
- expected Seller/recipient address;
- expected amount in wei;
- confirmation count.

## Step 8 — Independent GitHub verification

Run the GitHub Actions workflow:

```text
Marketplace ETH Sepolia E2E
```

Use **Run workflow** and provide:

- `order_id`;
- `tx_hash`;
- `expected_sender`;
- `expected_recipient`;
- `expected_amount_wei`;
- `min_confirmations = 3`.

The workflow never needs a Buyer or Seller private key.

It uses the repository `ETH_SEPOLIA_RPC_URL` secret only to read public chain state.

A successful run creates:

```text
marketplace-eth-sepolia-e2e-evidence.json
```

with a SHA-256 `evidenceHash`.

That artifact is independent evidence that the specified Sepolia transaction matches the E2E expectations.

## Step 9 — Complete the order

Return to the Seller.

Only after the order reports:

```text
payment.status = PAID
```

mark the order `COMPLETED`.

Expected final lifecycle:

```text
WALLET_VERIFIED
  -> REQUEST_SIGNED
  -> REQUESTED
  -> ACCEPTED
  -> PAYMENT_INTENT
  -> TX_SUBMITTED
  -> CONFIRMING
  -> PAID
  -> COMPLETED
```

## Negative-path checks

A full E2E validation should also prove that MyZubster rejects or refuses completion for:

- wrong MetaMask Buyer account;
- wrong network;
- wrong Seller recipient;
- insufficient ETH amount;
- failed transaction;
- insufficient confirmations;
- reused transaction hash;
- an order that is not `ACCEPTED`;
- a Seller that does not accept ETH;
- a Seller without a verified EVM wallet.

## Acceptance evidence

Do not describe the ETH Marketplace flow as production-ready based only on code or unit tests.

The real-wallet E2E gate is satisfied only when there is evidence for all of the following:

```text
real Buyer MetaMask approval
+ real Seller address
+ real Sepolia transaction hash
+ MyZubster PAID transition
+ required confirmations
+ independent verifier PASS
+ final COMPLETED transition
```

Mainnet remains out of scope for this test.
