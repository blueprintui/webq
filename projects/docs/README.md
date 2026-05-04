# @webq/docs

Static documentation site for `webq`. Currently a single hand-written HTML page in `src/`.

## Local preview

```bash
bunx serve projects/docs/src
```

Or open `projects/docs/src/index.html` directly in a browser.

## Deploy

Pushed to GitHub Pages by `.github/workflows/deploy-docs.yml` on every push to `main` that touches `projects/docs/**`. The workflow uploads `projects/docs/src/` as the Pages artifact — no build step.

A one-time setup is required in the GitHub repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
