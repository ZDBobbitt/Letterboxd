# Reel Ranked

A local app that ranks a public Letterboxd profile's 50 most recent diary entries in poster tiers.

## Start it

Requires Node.js 20 or later. In this folder, run:

```powershell
node server.mjs
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173). Press `Ctrl+C` in the terminal to stop it. You can also open `index.html` directly or host it as a static site, including on GitHub Pages.

## How it works

The app reads the profile's public Letterboxd RSS feed through `proxy.cors.dev`, which provides up to 50 recent diary entries, and groups them by the member's current rating. Rewatches remain separate entries. The public CORS bridge receives the requested username to forward the feed request and must be available for lookups to work.

Private profiles and unavailable feeds cannot be loaded. The app does not ask for a Letterboxd password or store searches.
