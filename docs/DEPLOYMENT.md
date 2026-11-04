# Deployment

Nexus 2035 is a static site. Deployment is a push to `main`; GitHub Pages serves the repository root.
There is no build, no artifact upload, no server and no environment variables.

## 1. Pages configuration

| Setting | Value |
| --- | --- |
| Repository | <https://github.com/somphol/nexus-2035-house-tour> |
| Visibility | Public |
| Branch | `main` |
| Folder | `/` (repository root) |
| Build type | Legacy branch deployment (no Actions workflow) |
| Custom domain | None |
| HTTPS | GitHub-provided certificate |
| Live URL | <https://somphol.github.io/nexus-2035-house-tour/> |
| Canonical URL | same, declared in `index.html` |
| `.nojekyll` | Present and empty, at the root |

`.nojekyll` disables Jekyll processing, so every file is published verbatim, including folders that
begin with an underscore if one is added later. The site has no SPA routing; there are no redirects
and no `404.html`, so an unknown path returns GitHub's 404 page.

If the repository is renamed or transferred, update:

- `index.html` — canonical, Open Graph/Twitter URLs, social-card URL.
- `README.md`, `AGENTS.md`, `docs/DEPLOYMENT.md`.
- `script.js` — none (no absolute site URL in the app).
- `state.json` — historical; leave the original URL and note the move.

## 2. What is published

Everything tracked in the repository:

| Path | Served as | Purpose |
| --- | --- | --- |
| `index.html` | `text/html` | The app |
| `style.css` | `text/css` | UI |
| `script.js` | `application/javascript` | Engine |
| `state.json` | `application/json` | Historical build report (not fetched) |
| `README.md`, `AGENTS.md`, `docs/*.md` | `text/markdown` / `text/plain` | Documentation, linked from the README |
| `docs/*.png` | `image/png` | Social card and screenshots |
| `scripts/check.mjs` | `application/javascript` | Verification (not linked from the page) |
| `skills/**` | static files | Reusable skill and template |
| `robots.txt`, `sitemap.xml`, `.nojekyll` | static | Crawling, Pages config |

The application makes no same-origin data requests. Its only network dependencies are:

- `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js`
- `https://fonts.googleapis.com/css2?family=Manrope:…&family=Orbitron:…`

If any of those are blocked, the loader fails at `initEngine()` with “Spatial engine failed”. The
site itself still deploys.

## 3. Deploy

```bash
cd ~/Projects/nexus-2035-house-tour
node --check script.js
node scripts/check.mjs
git add -A
git commit -m "docs: add release documentation, reproduction book and skill"
git push origin main
```

Pages rebuilds automatically on the push. No branch, tag or release is created. Do not force-push;
the repository keeps linear history on `main`.

Credentials are handled by the machine's existing Git credential configuration. Do not add tokens,
`.env` files or credential helpers to the repository.

## 4. Verification

```bash
BASE=https://somphol.github.io/nexus-2035-house-tour
for p in / /index.html /style.css /script.js /state.json /docs/social-card.png /README.md /AGENTS.md; do
  printf '%s ' "$p"
  curl -s -o /dev/null -w '%{http_code} %{content_type}\n' -L "$BASE$p"
done
```

Expected: `200` for every path. On the release commit the observed values were:

```text
/                     200 text/html; charset=utf-8
/index.html           200 text/html; charset=utf-8
/style.css            200 text/css; charset=utf-8
/script.js            200 application/javascript; charset=utf-8
/state.json           200 application/json; charset=utf-8
/docs/social-card.png 200 image/png
/README.md            200 text/markdown; charset=utf-8
```

Then open the live URL and confirm the loader reaches “Nexus online”, the overview renders, and the
console has no uncaught errors. `view-source:` should show the current commit's `script.js` size.

The live page returns `cache-control: max-age=600` through Fastly, with `etag` and `last-modified`.
There is no service worker and no asset fingerprinting, so a browser can hold an old HTML/CSS/JS mix
for up to ten minutes after a deploy. Hard-reload (Shift-Reload) or open a private window when
checking a fresh push.

## 5. Rollback

```bash
git log --oneline -5
git revert <bad-commit>
git push origin main
```

A revert commit is preferred over a force-push. For a documentation-only regression, revert only that
commit. For a broken app, revert the source commit; Pages rebuilds the previous tree. Verify with the
HTTP loop above and a browser load. There is no release artifact to re-upload.

If Pages itself is misconfigured, restore **Settings → Pages → Source: Deploy from a branch → `main`
/ (root)**. Do not switch to GitHub Actions; there is no workflow in this repository.

## 6. Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Every URL 404 | Pages disabled, wrong branch/folder, or repository renamed | Check Settings → Pages; re-point to `main` / root; update absolute URLs after a rename |
| Home page 404, assets 200 | `index.html` missing or renamed | Restore the filename at the root |
| Loader stops on “Compiling shaders” / “Spatial engine failed” | WebGL unavailable or `three.min.js` blocked | Try another browser/GPU; check the CDN in the network panel |
| Loader stops with “OrbitControls failed to load” | `OrbitControls.js` blocked or version mismatch | Confirm both CDN tags are present and reachable |
| Scene renders but is black | Sun/exposure preset wrong, or context lost | Reset the tour; check `renderer.toneMappingExposure` and the console for a lost context |
| HUD visible, canvas blank | WebGL context creation failed (common in locked-down headless browsers) | Use a GPU-enabled browser; SwiftShader flags for headless |
| Fonts look like Arial/Helvetica | Google Fonts blocked | Expected fallback via `--font-body` / `--font-display`; the app still works |
| “AUTOSAVE BLOCKED” | `localStorage` disabled (private mode, policy) | Expected; the tour works in memory, export/import still function |
| Old build after push | Pages queued or browser cache (10 min) | Wait for the Pages run, hard-reload, compare `last-modified` |
| Minimap/room buttons dead | JS error before `bindUI()` | Open the console; check the loader text and network tags |
| 404 on a screenshot in docs | File renamed/moved | Update the Markdown link and `docs/` path together |

No analytics, CDN keys or secrets are involved. There is nothing to rotate after a deploy.

## 7. Local preview

```bash
python3 -m http.server 8080
# http://localhost:8080/
# http://localhost:8080/?room=living&light=neon&glass=privacy
```

A server is preferred over `file://`: the CDN scripts load either way, but `file://` gives
per-file storage semantics and some browsers restrict module/local font behaviour differently.
Use `localhost` when testing autosave or import.
