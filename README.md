# Greene Gaming: Murder in Metal City Add-Ons

Free, unofficial supplemental tools and cinematic scenes for Foundry VTT, targeting version 14. This is a development scaffold; no playable features have been integrated yet.

## Planned features
- Machine Court: original courtroom backdrop, original adjudicators, speaker lighting and exhibit presentation.
- Investigation Tracker: independently importable evidence board and tools, using GM-supplied evidence or existing world documents.
- Additional original visual aids as developed.

## Development and installation

The current manifest is a scaffold, not a public installation link. For local development, build with `python3 tools/build.py`, extract `dist/module.zip` into `Data/modules/gg-murder-in-metal-city/`, restart Foundry and enable the module in a test world. The archive has `module.json` at its root. Do not install this over an existing module of the same ID without a backup.

GitHub Actions validates and builds the scaffold on pushes to main and pull requests. An explicit `vX.Y.Z` tag matching the manifest version creates a draft release. Review all release assets and rights before manually publishing. No release will be made automatically public. If development uses a private repository, its releases are not publicly installable through Forge.

Planned public manifest (not live):
`https://github.com/bobzap66/gg-murder-in-metal-city/releases/latest/download/module.json`

## Content and rights

This project is not affiliated with, endorsed by, or sponsored by Paizo or Foundry VTT. The adventure is sold separately. Its title is used to identify intended compatibility; original adventure text, stat blocks, logos, maps, and published illustrations are excluded. New artwork based on established characters, campaign-specific clue content, and any other material derived from third-party IP are excluded pending review. Generated artwork will be disclosed and inventoried before release. No software or content redistribution license has yet been selected; do not redistribute the development files until rights and terms are finalized.

See [development roadmap](docs/ROADMAP.md) and [content policy](docs/CONTENT-POLICY.md).
