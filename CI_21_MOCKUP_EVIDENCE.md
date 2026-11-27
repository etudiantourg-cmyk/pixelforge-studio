# 21-scene browser verification

This CI-only change requests a pull-request run of the current 21-scene presentation renderer. The Chromium job must render all twenty-one scenes, verify unique IDs, PNG signatures, dimensions, visible foreground geometry and sampled color variation, then upload the images and manifest for visual inspection. The strict overall critic is expected to reject incomplete requirements.
