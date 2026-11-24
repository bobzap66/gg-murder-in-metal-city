# Greene Gaming: Murder in Metal City Add-Ons

Free, unofficial supplemental tools and cinematic scenes for Foundry VTT, targeting version 14. This is a development build. Base scene imports, the GM dashboard and Machine Court lighting controls are implemented; shared evidence library and board placement are implemented; other interactive features remain in development.

## Planned features
- Machine Court: original courtroom backdrop, original adjudicators, speaker lighting and exhibit presentation.
- Investigation Tracker: independently importable evidence board and tools, using GM-supplied evidence or existing world documents.
- Additional original visual aids as developed.

## Adventure Manager

In a Foundry v14 test world, enable the module, then open **Game Settings → Configure Settings → Module Settings → Greene Gaming: Murder in Metal City Add-Ons → Open Adventure Manager**. Only GMs can open the manager. A GM script macro can also call:

```js
await game.modules.get("gg-murder-in-metal-city").api.openManager();
```

Click **Install GM Macros** in Adventure Manager to create seven GM-only shortcuts in the Macro Directory folder Greene Gaming — GM Shortcuts. Drag the desired macros onto your hotbar. Existing tagged macros and equivalent manually created script macros are reused without overwriting; missing shortcuts can be restored by running installation again. No hotbar slots are assigned automatically. Macro calls use the module API and guard GM permissions. Install once per world, not per module update.

Import each base scene independently. Imported scenes are tagged with the module ID and feature ID, stored in a dedicated Scene folder, and not activated or shown in player navigation automatically. Existing tagged scenes are never overwritten; View opens the scene for the requesting GM only. Refresh checks the current world documents. Imports are guarded on the current client; use one GM for installation to avoid concurrent imports from different clients. The evidence template library previews the twelve blank designs without exposing any campaign data.

The courtroom includes the matching foreground image on the main v14 Level. Open **Director** beside an imported courtroom for speaker lighting, proceedings presets and reset. Open **Court officials** to import eight NPC journals and a GM Hearing Guide independently of the scene. See [courtroom instructions](features/courtroom/README.md). Open **Shared evidence library** to prepare private evidence drafts, publish player-readable snapshots and place discovered artwork with journal links on the investigation board. If an older development build placed board art incorrectly, use **Repair board alignment** in the Shared Evidence Library to realign existing managed images and reduce pin size without changing journals. New tiles use explicit top-left anchors for v14. For old court exhibits, re-present; for chase, initialize/repair; cast geometry edits preserve the visible position of legacy anchored tiles. Open **Exhibit control** in the Director to present the same published evidence, admit numbered exhibits and maintain a private trial register. Open **Cast & witnesses** in the Director to stage GM-supplied counsel and witnesses using image tiles, adjustable positions and spotlight cues. Open **Chase Director** beside an imported chase scene for configurable chase points, obstacle covers, independent party/drone markers and round tracking. See [chase instructions](features/chase/README.md). Courtroom ambience remains in development. No automatic scene imports or macros are created on world load. The dashboard and importer target Foundry v14, but have not yet been run in a live Foundry/Forge world.

## Portable configuration

Open **Configuration Import / Export** in Adventure Manager. See [portable configuration instructions](docs/CONFIGURATION.md). Private campaign JSON and licensed adventure material must remain outside this public repository.

## Development and installation

**Development manifest (test worlds only):**

`https://raw.githubusercontent.com/bobzap66/gg-murder-in-metal-city/dev-release/module.json`

Install via The Forge Bazaar's Custom Module manifest URL field. Check for custom package updates after a successful main build. The development channel uses the same module ID as the future stable channel, and each version has a unique ZIP. Do not install both simultaneously. Development builds use numeric patch versions `0.1.N` where N is the CI run number; reserve a later minor version for the first stable release. For local development, build with `python3 tools/build.py`, extract `dist/module.zip` into `Data/modules/gg-murder-in-metal-city/`, restart Foundry and enable the module in a test world. The archive has `module.json` at its root. Do not install this over an existing module of the same ID without a backup.

GitHub Actions validates and builds the scaffold on pushes to main and pull requests. An explicit `vX.Y.Z` tag matching the manifest version creates a draft release. Review all release assets and rights before manually publishing. Successful pushes to main also publish publicly accessible development packages to the separate `dev-release` branch. Stable releases still require deliberate publication. The development channel is not listed in the official package directory or Bazaar. Do not redistribute packages or add third-party content pending rights review.

Planned public manifest (not live):
`https://github.com/bobzap66/gg-murder-in-metal-city/releases/latest/download/module.json`

For a separate Forge development installation and verification checklist, see [Forge smoke test](docs/FORGE-TEST.md).

## Content and rights

This project is not affiliated with, endorsed by, or sponsored by Paizo or Foundry VTT. The adventure is sold separately. Its title is used to identify intended compatibility; original adventure text, stat blocks, logos, maps, and published illustrations are excluded. New artwork based on established characters, campaign-specific clue content, and any other material derived from third-party IP are excluded pending review. Generated artwork will be disclosed and inventoried before release. No software or content redistribution license has yet been selected; do not redistribute the development files until rights and terms are finalized.

See [development roadmap](docs/ROADMAP.md) and [content policy](docs/CONTENT-POLICY.md).
