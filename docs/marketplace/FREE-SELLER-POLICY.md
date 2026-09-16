# MyZubster Free Seller Policy

Status: **adopted product policy for the public app/store launch**.

## Principle

A basic MyZubster Seller account is free to create and maintain. MyZubster does not request payment or banking information merely to let a person experiment with selling.

```text
Download / open MyZubster
        ↓
Create a free account
        ↓
Become a Seller — SELLER_FREE
        ↓
Create and publish listings
        ↓
Receive real requests / an eligible paid order
        ↓
First real earning or payout attempt
        ↓
Activate payment onboarding / required verification
        ↓
MyZubster retains the disclosed 2% platform commission
```

## Free-first rule

MyZubster must not require Stripe, a card, bank details or a recurring subscription during basic Seller onboarding.

A Seller can first create a profile, publish eligible listings, receive Marketplace requests, use basic messaging and build early reputation. Payment-provider onboarding is deferred until the Seller actually needs to receive money through MyZubster.

The customer-facing rule is:

> **Pubblica gratis. Paghi solo quando inizi a guadagnare.**

## Initial experimentation allowance

The launch target is **up to 5 active commercial listings for a Free Seller**. This threshold is an experimentation/product limit, not an automatic billing trigger.

Reaching the threshold must not silently charge the user or silently start a subscription. MyZubster may ask the Seller to close/replace an existing listing or choose a future optional professional capability.

Free and barter community exchanges may follow category-specific rules and are not paid transactions merely because they appear in the Marketplace.

## When payment onboarding begins

Payment onboarding begins only when there is a concrete monetization event: the Seller has an eligible real paid transaction to receive or requests a payout/payment capability.

At that point the interface must explain what information is required, why it is required, which payment provider processes it, the **2% MyZubster platform commission** on the eligible paid transaction, and any separate payment-processing costs that apply before the user accepts.

MyZubster should avoid collecting or storing banking/payment information itself when the payment provider can securely collect the required information.

## Transaction commission

For eligible Marketplace transactions paid through the supported MyZubster payment flow, the platform commission target is **2% of the transaction amount**.

The commission:

- is not charged for account creation;
- is not charged for publishing an advertisement;
- is not triggered by account age or listing count;
- is not charged on FREE or BARTER exchanges;
- must be disclosed before the paid transaction is accepted;
- is recorded only from verifiable payment evidence, not inferred from clicks or requests.

The exact payment-routing implementation must follow payment-provider, tax, consumer, marketplace and app-store requirements applicable to the transaction and geography.

## No automatic conversion

`SELLER_FREE` never silently becomes a paid subscription because of listing count, elapsed time, account age or Marketplace activity.

Any future Seller Pro subscription, promotion, advanced tool or other recurring fee must be separately disclosed and explicitly accepted. It must not be required merely to open a Seller profile or publish within the Free Seller allowance.

## Free Seller includes

- Seller profile activation;
- up to 5 active commercial listings at launch;
- management of eligible listings and stock where applicable;
- receiving Marketplace requests;
- basic private Marketplace messaging where available;
- reputation associated with completed exchanges where implemented;
- normal community Marketplace participation.

## Migration from the old Seller subscription MVP

The repository contains a legacy `SELLER_MONTHLY` Stripe flow with a monthly price. It predates this policy and is not the public free-first onboarding model.

Migration rules:

1. `SELLER_FREE` is the default/basic Seller plan;
2. basic Seller activation requires no payment;
3. Stripe/payment onboarding is removed from the initial Seller journey;
4. the launch target is 5 active commercial listings for Free Seller;
5. reaching the limit never causes an automatic charge;
6. payment onboarding appears at the first real earning/payout step;
7. the 2% platform commission is disclosed for eligible paid transactions;
8. existing legitimate paid subscription state is preserved safely during migration and no new recurring subscription is created implicitly;
9. Zorgax and Marketplace UI must explain the same policy;
10. automated tests must verify free activation, listing limits, payment-onboarding trigger and commission calculation;
11. App Store / Google Play, tax and payment-provider requirements must be reviewed before release.

## Evidence boundary

`SELLER_FREE` describes account access and product policy. It does not prove that a seller is identity-verified, licensed, commercially registered, trusted, endorsed by MyZubster, or authorized for every category.

Verification, category eligibility, moderation, legal obligations, transaction evidence and payout eligibility remain separate states.

## Product rule

> **Try first. Publish first. Monetize only when real earnings exist. Never charge silently.**
