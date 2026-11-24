# Changelog

## 0.1.0 (unreleased)
- Initial module manifest, development layout and draft-release workflow.
- Original courtroom art, unbranded chase art, and reusable investigation board and templates.
- GM-only Adventure Manager built on ApplicationV2, with independent base scene imports, world-document status, view controls, and a read-only evidence template library.
- Import uses v14 scene levels and does not overwrite existing flagged scenes or activate scenes for players.
- Automated unit checks for feature registry, asset paths, scene data and evidence catalog.
- Machine Court Director: 14 managed lights, 16 cues, missing-light repair and ambient reset; accessible from the Adventure Manager or GM macro.
- Eight original court official journals and GM Hearing Guide; private-by-default, missing-only imports, portraits and character cards, roster and current-speaker journal shortcuts.
- Shared evidence library with private drafts, explicit player-readable journal snapshots, withdrawal, eleven board slots, native journal pins and replaceable subject portrait/name.
- Courtroom exhibit controller reuses published evidence artwork and journals, with screen tiles, optional lighting, stable exhibit numbering, admission tracking, configurable target and private trial register.
- Courtroom cast controls: three adjustable image-tile stations, native asset picker, world actor artwork selection, mirror, spotlight and dismissal without modifying actors.
- Chase Director with eight obstacle covers, manual chase-point targets and adjustments, independent party/drone movement, round tracking, persistent scene state and overlay repair.
- Versioned development manifest channel and automated publication after passing main builds; stable releases remain draft-only.
- Fix native Foundry window close/menu controls remaining disabled after module operations; scope busy state to content actions and restore prior button state in every GM panel.
- Install GM Macros creates seven reusable GM-only shortcuts in a dedicated Macro folder, skips existing tagged or equivalent manual macros, and preserves hotbar assignments.
- Cast placement: direct movement/size nudges, adjustable step, numeric and mirror live updates, native tile dragging and lock controls; active lighting cue toggles to Normal / Reset.
- Explicit v14 top-left tile anchors for evidence, subjects, cast, exhibits and chase overlays. Repair board alignment realigns existing managed artwork and shrinks journal pins without changing published journals; native image pickers in evidence editor.
- Portable versioned JSON configuration export, validated preview, image path remapping and GM-only merge/import for scene setup, court, investigation and chase; explicit opt-in for published campaign state.
- Live Foundry/Forge verification and remaining interactive feature controls remain pending.
