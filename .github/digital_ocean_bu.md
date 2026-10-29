```yml
name: AI PR Validation

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

# Least privilege: read code, write the PR comment. Nothing else.
permissions:
  contents: read
  pull-requests: write

concurrency:
  group: ai-pr-validation-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  validate:
    # Skip drafts and forks (forks don't get access to secrets anyway)
    if: >
      github.event.pull_request.draft == false &&
      github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      # Check out the BASE branch, not the PR head: the script and the
      # requirements come from trusted code, so a PR can't edit its own judge.
      - name: Checkout base branch (trusted code only)
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.base.sha }}

      - name: Validate PR against requirements
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_BRANCH: ${{ github.event.pull_request.head.ref }}
          PR_BODY: ${{ github.event.pull_request.body }}
          # Agent endpoint (OpenAI-compatible chat completions), e.g. your
          # DigitalOcean GenAI agent: https://<agent-id>.agents.do-ai.run
          AGENT_URL: ${{ secrets.AGENT_URL }}
          AGENT_TOKEN: ${{ secrets.AGENT_TOKEN }}
          AGENT_MODEL: ${{ vars.AGENT_MODEL }}   # optional
          REQUIREMENTS_FILE: .github/pr-requirements.md
          MAX_DIFF_CHARS: "120000"
          FAIL_ON_VERDICT: "false"               # "true" = fail the check on FAIL
        run: python3 .github/scripts/validate_pr.py

```