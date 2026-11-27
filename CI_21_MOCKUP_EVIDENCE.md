# 21-scene browser verification

This CI-only change requests a pull-request run of the current 21-scene presentation renderer. The Chromium job must render all twenty-one scenes, verify unique IDs, PNG signatures, dimensions, visible foreground geometry and sampled color variation, then upload the images and manifest for visual inspection. The strict overall critic is expected to reject incomplete requirements.


Follow-up render revision includes refinements to apparel logo clearance, backpack zipper placement, delivery-van glazing, and darker fabric materials. Re-run the same 21-scene browser test against the latest main branch.
