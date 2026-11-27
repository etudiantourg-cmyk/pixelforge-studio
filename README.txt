PIXELFORGE STUDIO — Logo Conversion Foundation
================================================

CURRENT STATUS
The active Render frontend is a static site. Logo conversion now sends a downscaled PNG (maximum 1800×1800) to the project's separate Render Node backend at /api/vectorize. The backend runs VTracer WASM on CPU. No GPU, API key, paid AI provider, or external inference service is required. If the service is unavailable, the browser falls back to ImageTracerJS.

Frontend URL:
https://pixelforge-studio-app.onrender.com

Repository:
https://github.com/etudiantourg-cmyk/pixelforge-studio

LOCAL VALIDATION
Requirements: Node.js 20+
Run:
  npm run validate

This performs static source checks and executable regression tests for the background flood-fill algorithm. The GitHub Actions workflow installs the pinned VTracer package, runs a direct WASM conversion test, starts the Node API on a temporary local port, tests the `/api/vectorize` HTTP path, and verifies rejection of an untrusted Origin. A passing source-level test is not a substitute for a live browser end-to-end test. A separate `npm run critic` gate rejects the entire release unless every requirement in `ACCEPTANCE_MATRIX.json` is marked EXCELLENT / VERIFIED with implementation, test and evidence paths. The gate is intentionally expected to fail while any requirement remains incomplete.

LOGO CONVERSION ENGINE
- Raster source upload and preview.
- Primary vector engine: VTracer 1.0 WASM on the project's Node backend, using spline fitting, curve simplification, color clustering, and SVG optimization.
- Local ImageTracerJS fallback if the VTracer service is unavailable; the interface identifies which engine produced the current output.
- Edge-connected white/black background removal: only matching pixels connected to the image border are removed, preserving enclosed details; the processed alpha channel is written into the PNG passed to the vector engine.
- Color, black and white SVG variants.
- True vector PDF exports generated directly from sanitized SVG paths (master, black, and white variants) using pinned free browser libraries.
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

COST AND OPERATIONAL REQUIREMENTS
The owner must not perform technical or operational setup. The service requires no API key, paid AI provider, GPU rental, credit card, or secret configuration. Logo tracing runs on the existing free Render CPU service, with a local browser fallback. The Render free service can sleep when idle and has usage limits; this is a free-tier constraint, not a hidden paid dependency.

RENDER
Frontend service: pixelforge-studio-app (static site; publish path .)
Separate backend service: pixelforge-studio-zajl (Node web service; npm install / npm start)
Both services are configured for automatic deploys on commits, but each new deployment must be verified in Render before claiming it is live.

QUALITY POLICY
See QUALITY_GATE.md. No release is accepted unless every requirement is independently tested and rated EXCELLENT / VERIFIED. The current build remains REJECTED / FOUNDATION ONLY.


3D PRESENTATION MOCKUPS
- The browser now renders twenty-one local 3D product scenes and maps the uploaded logo onto each surface: T-shirt/apparel, fabric tote, paper shopping bag, rigid gift box, shipping carton, ceramic mug, bottle/product container, cap, storefront sign, business cards, letterhead, envelopes, and laptop branding.
- Each scene is rendered at 1200×900 and exported as PNG. Individual images can be downloaded, filtered by product family, and included in the main ZIP or a separate mockup ZIP.
- Rendering is local in the browser using the free Three.js library; the logo artwork is not uploaded to a mockup service. A Chromium/WebGL browser smoke test is included in GitHub Actions.
- These are procedural 3D studio renders with modeled geometry, materials, lighting and shadows. They are not photographs or verified production proofs; photographic mockup assets and print/vendor proofing remain separate acceptance requirements.


MOCKUP QUALITY AND VERIFICATION UPDATE
- The 13 studio scenes now compute their model bounds, sit on the ground plane, and automatically frame the product to the camera instead of using one fixed camera crop for every product.
- Mug and bottle logo decals use curved surface geometry to follow their cylindrical bodies.
- The browser test uses pinned Three.js 0.128.0 and Playwright 1.56.1 packages, runs Chromium with software WebGL, verifies each PNG's signature, dimensions, non-empty pixel content, visible product geometry and material/light variation, and saves 13 PNGs plus a manifest as a CI artifact.
- Browser output evidence is a test artifact, not proof of photographic realism or vendor/manufacturing approval.

- The latest lighting pass reduces exposure and key/fill/rim light intensity to preserve textile, ceramic, kraft-paper, and metallic surface contrast. Gift-box ribbon placement no longer crosses the center of the logo; the shipping carton has a cross-tape layout.
- Chromium evidence is retained as a 7-day GitHub Actions artifact. The sampled color-diversity threshold was calibrated against the first real render measurements (11–98 sampled color buckets across the thirteen scenes); it is a basic render-integrity check, not a subjective quality score.


EXPANDED PRESENTATION SET
- The presentation library now contains 21 scenes: T-shirt, hoodie, polo shirt, fabric tote, paper shopping bag, backpack, rigid gift box, shipping carton, mailer box, mug, bottle, cylindrical product tube, cap, storefront sign, billboard, business cards, letterhead, envelope, laptop, smartphone, and delivery van.
- Each scene uses a product-specific 3D model and logo placement. The full set is required in the main delivery ZIP; incomplete sets are rejected.

- Latest verified run: GitHub Actions run 140 passed the real Chromium/WebGL render test for all 21 scenes and uploaded PNG evidence. The overall strict critic still rejects the release because other product requirements remain incomplete.
- The 3D scenes are modeled studio renders, not photorealistic photography or vendor-approved proofs.

- Presentation-suite scope is now 21 distinct product scenes, including apparel, totes and backpacks, paper and rigid packaging, drinkware, stationery, storefront/billboard signage, phone/laptop and delivery van. The browser suite asserts all 21 unique scenes, not merely the original thirteen. This is breadth of coverage only; every scene remains subject to individual visual acceptance.
