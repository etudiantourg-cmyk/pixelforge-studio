# PIXELFORGE STUDIO — Non-negotiable acceptance charter

## Governing rule
Every explicit project requirement is mandatory, regardless of apparent size. Omitting, weakening, silently replacing, or leaving any one requirement unimplemented invalidates acceptance of the entire release. There is no weighted average and no partial pass.

## Roles and separation of duties
- **Project owner:** sole final decision-maker. May rely on the independent critic's evidence-based recommendation; retains final authority.
- **Engineer:** implements requirements, documents design decisions, runs tests, discloses limitations and defects. The engineer cannot self-approve a release.
- **Independent critic:** reviews requirements individually, reproduces tests independently, inspects the actual running product and artifacts, and may reject any stage. The critic must provide evidence and must not accept untested claims.

## Acceptance gate
A release is accepted only if every requirement is marked **EXCELLENT / VERIFIED** with reproducible evidence. Any other state — good, partial, failed, unknown, not tested, blocked, or omitted — means **REJECT THE ENTIRE RELEASE**. Return the work to engineering and retest all affected requirements. Never lower the bar to meet a deadline.

## Mandatory review sequence
1. Requirement inventory and traceability.
2. Architecture and feasibility review.
3. Implementation review.
4. Functional tests on every user workflow.
5. Output/artifact integrity and format validation.
6. Responsive, accessibility, security, privacy, and error-path review.
7. Deployment and live smoke tests.
8. Independent critic's final report and owner's decision.

## Requirement traceability register
Each requirement must have: unique ID, exact wording, implementation location, test procedure, expected result, observed result, evidence, critic verdict, and owner decision. A missing field is a failed gate.

## Current product scope (logo conversion, not logo generation)
The product must transform an uploaded existing logo/artwork into professional, editable vector artwork and prepare the full requested delivery package. It must not substitute a from-scratch logo generator for image-to-logo conversion.

Required capability groups to be individually specified and verified:
- Source ingestion, validation, orientation, transparency, color profile, resolution, and error handling.
- Image cleanup, background handling, edge preservation, shape reconstruction, vector paths, curves, nodes, geometry, and typography fidelity.
- Editable master vector and variants: full color, monochrome, black, white/reversed, symbol-only, wordmark, horizontal, vertical, and responsive variants where applicable.
- Export formats and integrity: SVG, PDF, EPS, PNG, and other explicitly requested production formats. Each must be a real valid file, not a renamed extension.
- Digital asset sizes, app/site favicons, social profile/cover formats, and retina sizes.
- Print specifications including dimensions, bleed/safe areas where relevant, color-mode conversion and profile disclosure. CMYK must not be claimed unless genuinely generated and verified.
- Brand geometry: construction grid, clear space, minimum size, proportions, and alignment.
- Brand stationery and collateral: business cards, letterhead, envelopes, email signatures, presentations, social templates, signage, packaging, merchandise and other client-requested applications.
- Professional presentation/mockups. Template previews must never be represented as photographic mockups.
- Brand guideline document and organized delivery folder/ZIP.
- Accessibility, Arabic/RTL usability, mobile/desktop responsiveness, privacy, security, performance, and operational reliability.

## Current build status — 2026-11-27
- The existing repository and Render services were inspected.
- The existing product was a generic image editor, not a complete logo conversion system.
- Browser-side conversion foundation: image upload, raster-to-SVG tracing via ImageTracerJS, pixel-level white/black transparency preprocessing, monochrome variants, PNG exports at 9 sizes, SVG-based browser print flow, and ZIP delivery with palette manifest and preliminary brand notes.
- Added source-image preview and structural vector diagnostics (path count, path-command estimate, viewBox, extracted fill palette).
- Fixed a data-flow defect discovered during review: edge-connected transparent pixels are now written back to the canvas before creating the PNG uploaded to VTracer; previously the API received the original unmodified canvas while only the local fallback used the modified pixel buffer. Added a regression guard for this exact ordering.
- Removed the unused Cloudflare Workers AI FLUX.2 image-editing API, its API-token/account requirements, and its `/api/edit` and `/api/generate` routes. The product scope is logo conversion only; no paid AI provider or API credential is required. The backend health endpoint now reports the local CPU vector engine. The remaining Render web service is verified on the Free plan.
- Added a VTracer 1.0 WASM vectorization endpoint to the Node backend using the pinned `@visioncortex/vtracer@1.0.0-alpha.4` package. The frontend sends its downscaled PNG to this endpoint, and retains ImageTracerJS as a clearly identified local fallback. The endpoint enforces the static-site Origin, existing per-IP rate limit, one concurrent vector job, PNG signature/IHDR validation, and an 1800×1800 / 3.24 MP dimension ceiling.
- Added a GitHub Actions dependency-install step and a VTracer WASM smoke-test script using synthetic RGBA pixels and a real local HTTP integration test that starts the Node server, posts a generated PNG through `/api/vectorize`, verifies SVG output, and confirms rejection of a foreign Origin. The workflow is configured to run both project validation and the actual package smoke test on pushes.
- Replaced global near-white/near-black deletion with edge-connected flood-fill background removal. Only matching pixels connected to the image border become transparent; enclosed details are preserved. Processing occurs after scaling the working image to at most 1,800 px on its longest side and reports the removed-pixel count.
- Added executable regression tests for white-background removal, black-background removal, preservation of enclosed white details, and the keep-background mode. Fixed the conversion status counter's scope and added a static guard for it.
- Added pre-export SVG validation: XML parser-error rejection, SVG root and finite positive viewBox checks, path-data presence checks, rejection of script/foreignObject/embedded media, event-handler attributes, external href/src references, external CSS URL references, and NaN/Infinity values. The normalized master and all three color variants are validated before enabling exports.
- Corrected a stale validator marker for the source preview and added static checks for SVG validation and variant validation. Source parsing and marker audit passed in this session; the actual `npm run validate` command and browser-level export tests remain unexecuted.
- Hardened source upload: accepts PNG/JPEG/WEBP only, caps files at 20 MiB, rejects dimensions above 10,000 px per side or 40 MP total, and invalidates old conversion outputs when a new file is selected.
- Added GitHub Actions workflow `.github/workflows/validate.yml` to run `npm run validate` and the real VTracer WASM HTTP smoke test on pushes, pull requests, and manual dispatch. No passing run for the newest commits has yet been independently retrieved.
- Added backend abuse-reduction controls: optional Origin allowlist enforcement, 5 requests per minute per in-memory client IP, 4,000-character prompt cap, 18 MiB decoded image cap, and a two-request concurrency ceiling with guaranteed slot release. These are not authentication, durable quotas, or protection against distributed abuse; rate counters reset on process restart.
- Removed an unused `ADMIN_PASSWORD` status claim. The current `.env.example` contains only a local PORT setting; no external API credentials are required.
- Added a dependency-free Node validation script at `scripts/validate.mjs` and `npm run validate`; its source syntax and app-script syntax were parser-checked in this session. The Node command itself has not been executed in a Render build.
- This is **not an accepted release**. Automated tracing is not equivalent to professional manual/vector reconstruction. The current build does not yet prove all required export formats, CMYK production, typography reconstruction, full collateral generation, realistic mockups, or independent quality approval.
- The current user interface explicitly discloses that the generated package is preliminary and not human-approved. SVG structural validation reduces malformed or unsafe export risk but does not certify design quality, typography fidelity, or production readiness.
- Render deployment evidence is recorded in the latest review addendum below. Subsequent commits after `f7cc7d86ae47da1edd9e008a1e297c03f6b6c168` still require a new deployment and verification before being called live.\n- GitHub combined commit status returned no status records for the last inspected build commit; the newly added Actions validation has not been confirmed passing. The frontend inline script and validator source were parser-checked, but `npm run validate` and `npm run test:vtracer` have not yet been confirmed in a real Node runtime.
- No claim of "excellent", complete, or production-ready is permitted until all requirement groups above are implemented and independently tested.

## Latest independent review addendum — 2026-11-27

- Confirmed the published npm package `@visioncortex/vtracer@1.0.0-alpha.4` exists and its official Node API includes `convertBuffer(buffer, options)` and `convertPixels(rgba, width, height, options)`. The implementation's package name, pinned version, and method signatures match the published documentation. This verifies API plausibility, not successful execution in this deployment.
- Confirmed the backend Render service URL is `https://pixelforge-studio-zajl.onrender.com`, and the frontend's vector endpoint URL matches it. Backend CORS preflight allows `Content-Type`, `POST`, and the exact static-site origin; the vector route additionally rejects other origins.
- A review found and fixed a real alpha-channel data-flow bug: background removal previously modified ImageData but encoded the original canvas pixels. The processed ImageData is now written back with `putImageData` before PNG encoding and upload. A regression assertion was added.
- A compatibility-only source harness executed the validation script against current source and reported 35 checks passed, including three flood-fill behavioral checks and the new alpha-channel propagation guard. This is not `npm run validate`, not a real Node runtime test, not a VTracer WASM conversion, and not a browser test.
- `scripts/vtracer-smoke.mjs` now explicitly tests direct WASM conversion, starts the actual Node server, posts a generated PNG through `/api/vectorize`, verifies SVG path output, and checks foreign-Origin rejection. The script has not yet been executed in a real Node/npm environment in this session.
- Latest repository HEAD inspected: `1e6211145f2f99a9ebd0cf2a5b59b491cbc85d23`. GitHub combined status returned no status records; no passing Actions run was established.
- Both Render services were deployed successfully on 2026-11-27 from commit `f7cc7d86ae47da1edd9e008a1e297c03f6b6c168`: frontend deploy `dep-dc4ohfe1egvs7398b0lg` reached `live` after a successful build; backend deploy `dep-dc4ohim1egvs7398bgk0` reached `live` after `npm install` reported 0 vulnerabilities and the Node process logged `PIXELFORGE STUDIO listening on 10000`. This proves deployment/build/startup, not successful end-to-end vector conversion from a browser.
- VTracer's actual API and version were verified from the package's published README and upstream repository. The selected library remains only an automated raster tracer; it does not by itself satisfy professional logo reconstruction or the full brand-delivery scope.

## Release decision
Current status: **REJECTED — FOUNDATION BUILD ONLY**.
Reason: the complete logo-conversion workflow and mandatory deliverables are not yet implemented or verified. No independent critic agent exists yet; this file is an acceptance charter and review record, not proof of an autonomous critic. Do not represent this build as finished or production-ready.


## Cost and owner-intervention constraint — 2026-11-27
- User requirement: the complete solution must remain free to use and the owner must not be asked to perform technical or operational steps; the owner only uses the finished application.
- Render backend service was inspected and its compute plan is `free`; the frontend is a Render static site, which Render documents as free to deploy. The free backend may sleep after 15 minutes idle, has an ephemeral filesystem, and is not production-SLA infrastructure.
- GitHub repository is public; GitHub states Actions minutes are free for public repositories.
- Removed Cloudflare Workers AI and all its secret requirements to prevent hidden API usage, paid inference dependencies, or requests for owner-provided credentials. Logo vectorization runs on the existing free CPU web service; ImageTracerJS remains the browser fallback.
- No paid plan, paid API, GPU rental, credit card, or owner setup step is introduced by this change. Free-host quotas and provider availability still apply; do not imply unlimited capacity or guaranteed uptime.


## Vector PDF delivery improvement — 2026-11-27
- Replaced the former print-dialog-based PDF button with direct PDF file generation using jsPDF 2.5.2 and svg2pdf.js 2.9.0, both MIT-licensed browser libraries loaded from pinned public CDN versions. The converter passes the validated SVG DOM directly to `pdf.svg()` and returns a PDF Blob; it does not embed a raster screenshot.
- Added master, black, and white vector PDF files to the ZIP package. The static validator now checks library pinning, SVG-to-PDF API usage, and all three ZIP entries.
- This is a source-level implementation claim pending real-browser PDF inspection and independent verification of text/path preservation, page bounds, and PDF output integrity. No CMYK, EPS, or print-profile certification is implied.


## Latest engineering iteration — 2026-11-27 (vector PDF)
- The PDF action no longer opens a print dialog. It now loads pinned jsPDF 2.5.2 and svg2pdf.js 2.7.0 browser builds and calls `pdf.svg()` on the sanitized SVG DOM, then saves the resulting PDF Blob. This is intended to retain vector paths rather than rasterizing the logo.
- The ZIP now includes master, black, and white PDF variants alongside the SVGs and PNGs.
- Static source assertions were added for the pinned libraries, SVG-to-PDF conversion call, PDF Blob output, and all three PDF package entries. They still need to pass in actual GitHub Actions and be verified with a PDF parser and browser inspection.
- Current repo HEAD after this iteration: `21aba72a39c87a96075d0a1a9ff19f9f58735117`. The Render deployments last confirmed live remain at `f7cc7d86ae47da1edd9e008a1e297c03f6b6c168`; the new PDF export changes are not yet confirmed deployed.
- Release remains **REJECTED — FOUNDATION BUILD ONLY**. EPS, ICC-managed CMYK, typographic reconstruction, complete collateral, true photographic mockups, and independent critic execution remain unimplemented or unverified.

- PDF converter was upgraded from svg2pdf.js 2.7.0 to 2.9.0 after review found the 2.7.0 CSS selector parser could hang on a crafted empty quoted selector. Upstream release notes identify a CSS selector parsing fix in 2.8.0; 2.9.0 is now pinned. The generated SVG is additionally constrained to sanitized VTracer/ImageTracer output, but this remains subject to real browser regression testing.

## Latest source audit — 2026-11-27
- Updated `svg2pdf.js` to 2.9.0. Upstream release history records a CSS selector parser fix in 2.8.0; the generated vector output is additionally rejected if it contains `<style>` or `<use>` elements before it reaches the PDF converter.
- Re-ran a V8 syntax parse of the current frontend inline script, backend source, validation script, and VTracer smoke-test module wrapper: all four parsed successfully.
- Re-ran the validation logic in a compatibility harness against current repository source: **37 source/algorithm assertions passed**, including three executable flood-fill cases and the PDF library/API/package-entry assertions. This is not a real `npm run validate`, browser PDF generation test, npm package execution, or VTracer HTTP smoke test.
- The VTracer smoke-test script's async module syntax parsed successfully when wrapped as an async module body. Actual package execution remains unverified until the GitHub Actions workflow is observed passing.
- No GitHub Actions status/run was returned for the latest push. Render frontend deployment for the latest PDF and SVG sanitizer changes must be checked independently.
- Current decision remains **REJECTED — FOUNDATION BUILD ONLY**. The PDF export is an implementation step, not a claim of release acceptance.

## Strict critic gate implementation — 2026-11-27
- Added `ACCEPTANCE_MATRIX.json` with 19 individually identified requirement groups, covering source ingestion, vector fidelity, typography, variants, exports, CMYK, digital assets, geometry, collateral, mockups, guidelines, free operation, owner non-intervention, security, E2E, and critic review.
- Added `scripts/critic.mjs` and `npm run critic`. It rejects any requirement not marked exactly `EXCELLENT / VERIFIED`, any verdict other than `ACCEPT`, and any missing implementation, test, or evidence path. It never awards partial credit.
- Added a separate GitHub Actions `strict-critic` job after engineering validation. It is intentionally expected to fail until every mandatory group has reproducible evidence.
- Important independence disclosure: this is a deterministic acceptance gate, not a separate autonomous AI critic. It enforces the non-negotiable acceptance policy but cannot replace an independent expert inspecting the actual visual outputs.


## Product presentation mockup kit — 2026-11-27
- Added `mockup-engine.js`, a browser-local Three.js renderer with thirteen product scenes: T-shirt/apparel, fabric tote, paper shopping bag, rigid gift box, shipping carton, ceramic mug, bottle/container, cap, storefront sign, business cards, letterhead, envelopes, and laptop branding.
- Logo aspect ratio is preserved on the product surfaces. Scenes are rendered at 1200×900 and exported as PNG. The UI provides product-family filtering, per-image download, a separate mockup ZIP, and inclusion in the main delivery ZIP.
- The renderer performs no network upload of the client's logo. Three.js is loaded from a pinned public CDN; the rendering itself runs in the browser using WebGL. If WebGL or the CDN is unavailable, the mockup feature reports a failure and the main ZIP refuses to silently omit the required thirteen-scene set.
- Added `scripts/mockup-browser-smoke.mjs`, a real Chromium/WebGL test that renders all thirteen scenes, decodes each PNG, checks dimensions and non-empty output, and rejects uncaught browser errors. GitHub Actions now installs Playwright/Chromium and runs this test automatically.
- Honesty boundary: these are procedural 3D studio renders with modeled geometry, materials, studio lighting and shadows—not photographs, not vendor-approved product proofs, and not evidence of physical production. The quality gate remains REJECT until the browser job passes and the scenes receive visual inspection. Photographic mockup sets and complete collateral remain outstanding.


## Latest mockup implementation audit — 2026-11-27
- Current source includes the thirteen-scene WebGL renderer and the browser test. V8 parsing passed for the frontend, mockup engine, validator, critic, mockup browser test module, and VTracer smoke-test module.
- The source validation logic was replayed in a compatibility harness against the current repository files: **49 assertions passed**. This includes the thirteen mockup scene markers, 1200×900 PNG export contract, local-only logo processing, browser-test assertions, and mandatory ZIP inclusion.
- The strict critic still rejects the project: 20 acceptance groups remain unaccepted. Mockup requirements are only PARTIAL / NOT TESTED until Chromium renders and visually inspected output evidence is available.
- The Chromium/WebGL smoke test is configured as a GitHub Actions job, but no actual workflow run result has yet been retrieved. Do not describe the browser render as tested or the mockup images as approved.
- The presentation images are procedural 3D studio renders, not photographs. They must not be represented as photographic product photography or manufacturing proofs. High-fidelity photographic mockup sets and broader collateral remain outstanding.
- The latest mockup changes are in GitHub; the Render live deployment and browser runtime still need independent verification.


## Expanded presentation bundle — 2026-11-27
- Expanded the renderer from ten to thirteen scenes by adding letterhead, envelopes, and laptop branding to the original apparel, bags, packaging, product containers, signage, and business-card set.
- The main ZIP now requires all thirteen rendered PNGs; it refuses to silently deliver a partial presentation set. Individual PNG downloads and a separate mockup ZIP are also available.
- Added per-scene progress feedback while rendering. The source harness was rerun after the expansion; all 49 static/source assertions pass. This remains source-level evidence only, not a successful real-browser render.
- Latest main-branch implementation commit at this review point: `ce41020d23bf478a9e564dd37fc5654658210019`. The temporary CI-trigger pull request was closed because no workflow-run evidence was returned by the available GitHub Actions query. No CI pass is claimed.
- Render deployment must be checked for this exact commit before the feature is described as live. Final release decision remains **REJECTED**.


## Mockup scene quality and CI hardening — 2026-11-27
- Corrected a real browser-test defect: the uniqueness assertion expected 10 IDs although the renderer now exposes 13 scenes. It now requires 13 unique IDs.
- Reworked scene composition: each product's 3D bounds are measured, its lowest point is placed on the studio floor, and the camera distance/target are computed from its actual dimensions. This removes the fixed-camera crop and floating-product defects for differently sized objects.
- Mug and bottle logos are now mapped onto curved mesh surfaces rather than flat floating planes.
- Browser tests now load the exact pinned Three.js 0.128.0 package locally (no CDN dependency in CI), with Playwright 1.56.1. They validate PNG signatures, 1200×900 dimensions, file size, color/material variation, visible product geometry, and browser errors.
- The test writes each rendered PNG and a manifest into `artifacts/mockup-browser/`; GitHub Actions uploads them for seven days for human visual inspection.
- These are substantive implementation improvements, not yet accepted quality claims. The real Chromium job must run successfully and the resulting images must be visually inspected before MOCK-01 or MOCK-02 can be accepted.
