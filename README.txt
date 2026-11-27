PIXELFORGE STUDIO — Logo Conversion Foundation
================================================

CURRENT STATUS
The active Render frontend is a static site. Its logo-conversion workflow runs in the browser and does not require the Node image-editing server.

Frontend URL:
https://pixelforge-studio-app.onrender.com

Repository:
https://github.com/etudiantourg-cmyk/pixelforge-studio

LOCAL VALIDATION
Requirements: Node.js 20+
Run:
  npm run validate

This performs static source checks, validates the inline application JavaScript syntax, checks required DOM references, and verifies key feature markers. It is not an end-to-end browser test.

LOGO CONVERSION ENGINE
- Raster source upload and preview.
- ImageTracerJS-based raster-to-SVG tracing.
- Optional near-white / near-black pixel transparency preprocessing.
- Color, black and white SVG variants.
- PNG exports at multiple pixel sizes.
- Preliminary ZIP package, palette manifest, and initial brand notes.

IMPORTANT LIMITATIONS
This is an automated tracing foundation, not a finished professional identity-design service. It does not yet guarantee:
- Manual-quality Bézier reconstruction, typography/font recovery, optical correction, or geometric redesign.
- Complete professional stationery, packaging, signage, merchandise, and campaign artwork.
- Photographic-quality mockups.
- Verified CMYK print production, bleed, EPS certification, or production-ready vector PDF.
- Independent expert approval of every generated asset.

Never use generated files for commercial print without visual and prepress review.

SEPARATE IMAGE-EDITING BACKEND
The repository also contains server.js, a separate Node service that calls Cloudflare Workers AI FLUX.2 Klein 4B. It is not the vector tracing engine.
Required environment variables for that service:
  CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_API_TOKEN
The backend applies a lightweight in-memory per-IP request limit (5 requests/minute), checks browser Origin when present, caps prompts at 4,000 characters, caps image payloads at 18 MiB, and limits concurrent AI calls to two. These are abuse-reduction measures, not authentication or a durable distributed quota; in-memory counters reset on restart and can be bypassed by distributed clients.
PORT is provided by the host.

Do not commit secrets to GitHub. Configure them in the hosting provider's environment settings. Cloudflare usage and limits depend on the account and plan.

RENDER
Frontend service: pixelforge-studio-app (static site; publish path .)
Separate backend service: pixelforge-studio-zajl (Node web service; npm install / npm start)
Both services are configured for automatic deploys on commits, but each new deployment must be verified in Render before claiming it is live.

QUALITY POLICY
See QUALITY_GATE.md. No release is accepted unless every requirement is independently tested and rated EXCELLENT / VERIFIED. The current build remains REJECTED / FOUNDATION ONLY.
