# Your first MyZubster contribution in 10 minutes

A short walkthrough. It links to the canonical docs instead of repeating them. If anything here conflicts with [CONTRIBUTING.md](CONTRIBUTING.md) or [BOUNTIES.md](BOUNTIES.md), those documents win.

You do not need KYC, a legal name, blockchain expertise or any crypto to start.

## 1\. Find an open issue (2 min)

* Browse the [open issues](https://github.com/MyZubster-Ecosystem/myzubster/issues). Issues titled **GOOD FIRST ISSUE** are a good place to start.
* Pick one focused task you understand: docs, tests, translations, accessibility or a small bug fix.
* Comment on the issue to claim it or ask a question, and wait for a maintainer to confirm scope:

```
CLAIM
GitHub username:
Contributor path: first-time
Issue:
Proposed approach:
Testing/evidence plan:
```

Creating new issues is currently restricted, so use existing ones.

## 2\. Fork and branch (2 min)

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/<your-username>/myzubster.git
cd myzubster
git remote add upstream https://github.com/MyZubster-Ecosystem/myzubster.git
git checkout -b <type>/issue-<number>-short-description
```

Keep each branch focused on one issue.

## 3\. Make the change and run the relevant tests (3 min)

* Change only what the issue asks for.
* Tests live in `tests/`. Install dependencies once, then run the suite or just the file that covers your change:

```bash
npm ci
npm test                                  # runs Jest
npx jest tests/bountySystem.test.js       # run a single test file
```

* The CI workflow ([`ci.yml`](.github/workflows/ci.yml), "Test, lint and build") runs automatically on pull requests to `main` and `develop`.
* For docs-only changes, check that the Markdown renders and every link works.
* Write down what you ran. You will paste it into the PR.
* The project requires Node 24.x (see `package.json`). Other versions usually install with an `EBADENGINE` warning, but results can differ from CI.

## 4\. Open a pull request (2 min)

```bash
git add <files>
git commit -m "<type>: short description (#<issue-number>)"
git push origin <your-branch>
```

Open a PR against `main` with:

```
What: what changed
Why: why it is useful
How: how you did it
Testing / evidence: what you ran or checked, and the CI result
Related issue: #<number>
```

Maintainers review in public and decide when to merge. Wait for the required checks to pass.

## 5\. Bounty states

Some issues carry a reward. The state tells you how far along that reward is. The canonical rules are in [BOUNTIES.md](BOUNTIES.md) and [TREASURY.md](TREASURY.md).

|State|What it means|
|-|-|
|**PROPOSED**|The bounty or reward has been suggested. It has not yet been validated, approved or funded.|
|**UNFUNDED**|An external reward (for example XMR or USD-equivalent) is declared, but no ecosystem funding has been reserved and recorded. Settlement stays pending.|
|**RESERVED**|The reward is earmarked for a named contributor, payable only after the scoped work is accepted. A reservation is not a payment.|
|**FUNDED**|A real ecosystem funding source has been reserved and recorded. This is the point at which an external reward is treated as payable.|
|**PAID**|Payment was made and independently verified (recipient, asset, network, amount, transaction ID and confirmations).|

**A proposed reward is not a funded bounty.** An issue, assignment, PR, merge, maintainer approval or ledger entry is not proof of payment, and no contributor, maintainer or founder is personally obliged to pay a bounty because an amount is displayed. Before treating an external reward as payable, confirm in the issue that it is FUNDED.

MYZ is an internal reward/accounting ledger, not an on-chain transaction.

## 6\. Crypto settlement needs explicit agreement

External settlement (XMR or any other asset) is a separate process from review. Agree the method explicitly in the issue before any payment, and note that unverified settlement stays `PENDING`, `UNSETTLED` or `FAILED` rather than `PAID`. Never post wallet seeds, private keys or passwords.

## Need help?

Comment on the issue you are working on. Small questions and small first proposals are welcome.

