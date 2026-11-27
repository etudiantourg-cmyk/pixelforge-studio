# Automated mockup verification trigger

This change exists only to request the configured pull-request CI run for the local 3D product mockup renderer. It does not change application behavior.

Required checks: static source validation, VTracer integration smoke test, strict critic (expected to reject the unfinished overall product), and Chromium/WebGL rendering of all ten mockup scenes.
