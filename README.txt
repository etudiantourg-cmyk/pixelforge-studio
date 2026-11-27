PIXELFORGE STUDIO — Logo Conversion Foundation
================================================

CURRENT STATUS
The active Render frontend is a static site. Logo conversion now sends a downscaled PNG (maximum 1800×1800) to the project's separate Render Node backend at /api/vectorize. The backend runs VTracer WASM on CPU; no GPU or Cloudflare token is required for vector tracing. If the service is unavailable, the browser falls back to ImageTracerJS. The FLUX image-editing API remains a separate function.

Frontend URL:
https://pixelforge-studio-app.onrender.com

Repository:
https://github.com/etudiantourg-cmyk/pixelforge-studio

LOCAL VALIDATION
Requirements: Node.js 20+
Run:
  npm run validate

This performs static source checks and executable regression tests for the background flood-fill algorithm. The GitHub Actions workflow installs the pinned VTracer package, runs a direct WASM conversion test, starts the Node API on a temporary local port, tests the `/api/vectorize` HTTP path, and verifies rejection of an untrusted Origin. A passing source-level test is not a substitute for a live browser end-to-end test.

LOGO CONVERSION ENGINE
- Raster source upload and preview.
- Primary vector engine: VTracer 1.0 WASM on the project's Node backend, using spline fitting, curve simplification, color clustering, and SVG optimization.
- Local ImageTracerJS fallback if the VTracer service is unavailable; the interface identifies which engine produced the current output.
- Edge-connected white/black background removal: only matching pixels connected to the image border are removed, preserving enclosed details; the processed alpha channel is written into the PNG passed to the vector engine.
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
The repository contains server.js, a Node service hosting both the VTracer WASM vectorization endpoint and a separate Cloudflare Workers AI FLUX.2 Klein 4B image-editing API. VTracer vectorization does not use Cloudflare or a GPU.
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
