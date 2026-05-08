# chaitanyantr.github.io

Personal portfolio for **Chaithanya Krishna Bodduluri**, deployed via GitHub Pages
at <https://chaitanyantr.github.io/>.

## Structure

```
.
├── index.html           # Single-page portfolio (bio, news, research, publications, experience)
├── apriltag.html        # AprilTag generator tool
├── style.css            # Shared site styles (typography, top nav, layout)
├── apriltag.css         # Styles specific to the AprilTag generator
├── main.js              # AprilTag generator logic (fetches SVGs from the apriltag repo)
├── img/                 # Profile + project images
└── googlea9494e4e587049c3.html  # Google Search Console verification (don't delete)
```

That's it — no build step, no framework, no jQuery. Open `index.html` in a
browser, or run a tiny local server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Just push to `main`:

```bash
git add -A && git commit -m "..." && git push origin main
```

GitHub Pages rebuilds automatically (~30–90 seconds).
