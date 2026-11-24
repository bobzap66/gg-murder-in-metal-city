# Development distribution channel

Permanent manifest: https://raw.githubusercontent.com/bobzap66/gg-murder-in-metal-city/dev-release/module.json

Every successful main push builds and tests the runtime code before publishing a development package. The separate dev-release branch contains module.json, build.json and immutable version-specific packages. The ZIP and its embedded manifest use identical version and URLs; the branch manifest is updated in the same commit as its package. An older queued run cannot overwrite a newer published run. The publish job does not run for pull requests or tags.

Versions are 0.1.N (N is the workflow run number) while the source baseline is 0.1.0. Reserve 0.2.0 or a higher minor for the first stable release so normal version comparison recognizes the upgrade. Development and stable share the module ID; switch channels deliberately using the desired manifest and backup, not by installing both. The stable release workflow remains tag-driven and draft-only.

These packages are publicly accessible, not private or official marketplace listings. No private campaign data, published adventure handouts or third-party artwork may be committed. Rights and licensing review still applies before wider distribution. Live Foundry/Forge validation is still pending. The development branch accumulates versioned ZIPs; retain needed rollback builds and review repository size periodically.

To diagnose an update, check the branch's build.json source commit and version, the successful publish-development job, and the version shown by Forge. If publication fails, the prior branch manifest remains in place. Avoid manually modifying the generated branch or reusing a package version.
