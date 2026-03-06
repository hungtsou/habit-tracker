# AI PR Review Setup

This repo uses [ChatGPT-CodeReview](https://github.com/anc95/ChatGPT-CodeReview) to automatically review pull requests using OpenAI.

## One-time setup

1. Go to your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `OPENAI_API_KEY`
4. Value: your OpenAI API key

## How it works

- Runs on every PR (opened, reopened, or when new commits are pushed)
- Uses `gpt-3.5-turbo` for cost-effective reviews
- Posts review comments directly on the PR
- Skips lock files, `node_modules`, and minified assets

## Cost

You pay only for OpenAI API usage (your key). Small PRs typically cost a few cents. `gpt-3.5-turbo` is used to keep costs low.
