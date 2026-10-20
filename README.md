# RedlineMD · landing page

Static site (HTML + CSS + vanilla JS), no build step.

## Deploy on Vercel
- CLI: inside this folder run `npx vercel` (preview) or `npx vercel --prod`.
- Or push this folder to a GitHub repo and import it at vercel.com/new
  (Framework preset: **Other**, no build command, output directory: `./`).

## Structure
- `index.html` – markup (single responsive page, mobile breakpoint at 760px)
- `styles.css` – styles and design tokens
- `script.js` – interactions (hero animation, upload flow, scroll comparison, stories, carousels)
- `assets/` – logo, corridor photo, favicon

To swap the logo, replace `assets/logo.png` (shown at 166×44 on desktop; export at 2× for sharpness).
The upload flow is front-end only: no file leaves the browser.
