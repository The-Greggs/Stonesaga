# Stonesaga

This repository contains fan-made web tooling and prototypes inspired by the Stonesaga board game universe.

## About Stonesaga (Board Game)

Stonesaga is an Open Owl Studios tabletop title presented on the studio site as a cooperative cozy gaming experience.

Official Stonesaga page (Open Owl Studios):

- [Open Owl Studios - Stonesaga](https://openowlstudios.com/pages/stonesaga-1)

Open Owl Studios is the copyright holder for Stonesaga and related official game content.

## About This Repository

This codebase is an unofficial companion project. The current playable web project is **Foraging**.

## Live Site

- [GitHub Pages - Stonesaga Foraging](https://the-greggs.github.io/Stonesaga/)

## Repository Structure

```text
Stonesaga/
  Foraging/
    ARCHITECTURE.md
    app.js
    index.html
    style.css
  .github/workflows/
    pages.yml
```

## Deployment

This repository deploys to GitHub Pages using GitHub Actions.

- Workflow file: `.github/workflows/pages.yml`
- Deploy source: `Foraging/`
- Trigger: push to `main`

## Local Development

For now, this is a static site.

1. Open `Foraging/index.html` directly in a browser, or
2. Run any simple local static server from the repository root.

## Expanding the Repo

You can add more projects alongside `Foraging/` over time. Keep each project in its own folder under the Stonesaga root.
