# Later
Minimal save-for-later app. Static site on GitHub Pages; data stored in a private repo (`data.json`).

## Setup
1. Create a **private** repo `later-data` (tick "Add a README").
2. Create a fine-grained token (Settings > Developer settings): only `later-data`, permission **Contents: Read and write**.
3. Push this folder to a public repo `later`, then Settings > Pages > Deploy from branch `main` / root.
4. Open `https://USERNAME.github.io/later/`, enter `USERNAME/later-data` and the token. Repeat on each device.
5. iPhone: Share > Add to Home Screen.

## Structure
`js/github.js` API only · `js/store.js` data + sync · `js/ui.js` rendering · `js/theme.js` · `js/main.js` startup · `css/style.css`

## Quick add via URL
`.../later/?t=Title&u=https://example.com` prefills the form (use with an iOS Shortcut).
