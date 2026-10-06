# Zorgax GitHub automation

Zorgax can assist contributors directly inside MyZubster GitHub issues and pull requests.

## Activation

Comment with:

- `/zorgax <request>`
- or mention `@zorgax`

The workflow sends only the current issue/PR title, a bounded excerpt of its body, and the invoking comment to the MyZubster Zorgax assistant endpoint. The response is posted back as a GitHub comment.

If an issue is labeled `zorgax`, the workflow posts activation instructions but does not invoke the assistant automatically.

## Safety boundary

Zorgax is assistance-only in this workflow. It does not merge pull requests, push commits, change labels, make payments, approve spending, publish secrets, or represent external organizations. The request prompt explicitly excludes secrets, seed phrases, health data, and other sensitive personal information.

The workflow ignores bot-authored comments to prevent response loops. Context and response sizes are bounded and the job has a short timeout.

## Configuration

Default assistant endpoint:

`https://www.myzubster.com/api/zorgax/assistant/chat`

Repository administrators can override it with the repository variable `ZORGAX_GITHUB_ASSISTANT_URL`.

The workflow uses only the scoped GitHub Actions token and does not require a personal access token for posting issue/PR comments.
