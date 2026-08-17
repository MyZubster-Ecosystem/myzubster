# Multi-Asset Bounty Rewards

Bounties support explicit MYZ, XMR and TOKEN reward components, including combinations. Each component carries its canonical amount, payment status, optional network/contract identity, contributor wallet, transaction reference and Treasury source reference.

Non-MYZ rails remain pending until the corresponding Treasury/payment/verifier path is online. Token identity is `chain/network ID + contract address`; token amounts are stored in canonical string units to avoid floating-point loss.

A contributor wallet is captured per selected asset and is the sole recipient for that payment attempt. Missing or invalid wallet data blocks settlement.

Payment allocation, submission and verification remain distinct states; no adapter response alone is sufficient to establish `PAID`.
