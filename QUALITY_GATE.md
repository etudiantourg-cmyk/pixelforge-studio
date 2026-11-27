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
- Added GitHub Actions workflow `.github/workflows/validate.yml` to run `npm run validate` on pushes, pull requests, and manual dispatch. The latest commit's CI status must be checked before treating the workflow as passing.
- Added backend abuse-reduction controls: optional Origin allowlist enforcement, 5 requests per minute per in-memory client IP, 4,000-character prompt cap, 18 MiB decoded image cap, and a two-request concurrency ceiling with guaranteed slot release. These are not authentication, durable quotas, or protection against distributed abuse; rate counters reset on process restart.
- Removed an unused `ADMIN_PASSWORD` status claim. The current `.env.example` contains only a local PORT setting; no external API credentials are required.
- Added a dependency-free Node validation script at `scripts/validate.mjs` and `npm run validate`; its source syntax and app-script syntax were parser-checked in this session. The Node command itself has not been executed in a Render build.
- This is **not an accepted release**. Automated tracing is not equivalent to professional manual/vector reconstruction. The current build does not yet prove all required export formats, CMYK production, typography reconstruction, full collateral generation, realistic mockups, or independent quality approval.
- The current user interface explicitly discloses that the generated package is preliminary and not human-approved. SVG structural validation reduces malformed or unsafe export risk but does not certify design quality, typography fidelity, or production readiness.
- The latest GitHub commits, including the SVG validation updates, are not present in Render's deployment history. The frontend still reports the old live deploy at `d47318ff375e1935ef91269e6454389dde19751f`; the backend still reports the old live deploy at `98fa4aefc6c730673bb767563fa3835d078d7f8c`. The static site is configured for automatic deploys, but the last confirmed live deploy still points to commit `d47318ff375e1935ef91269e6454389dde19751f` from 2026-11-26. Newer commits through `b47d781d6d5d6c2494405e9dd4dba69239cbacf8` have not been confirmed live. Live HTTP verification was unavailable from this execution environment.\n- GitHub combined commit status currently returns no status records for the newest inspected commit `92b539fbd9486c77d3dfb8a3a2bfd7f40ba4c274`; the newly added Actions validation has not been confirmed passing. The frontend inline script and validator source were parser-checked in this session, and the validator's feature markers were audited against the current source; however, the validator command itself has not been run in GitHub Actions or locally.
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
