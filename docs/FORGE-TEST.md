# Forge development smoke test

Status: development only, not a public release. Baseline build: `15e2f8bab691e5efdc85371acc22c5c0c9be03b3` (v0.1.0). Automated checks passed; no live Foundry/Forge verification yet.

## Installation

1. Sign into GitHub and download the [foundry-module artifact](https://github.com/bobzap66/gg-murder-in-metal-city/actions/runs/45467990086/artifacts/14955309113). Artifacts expire; if unavailable, use the latest successful build on main or build locally with `python3 tools/build.py`.
2. Extract the outer archive. Upload the inner `module.zip` using The Forge's Import Wizard. Choose custom module rather than Bazaar installation if offered. Do not upload the outer archive. If necessary, use Local Folder with the extracted module folder containing module.json.
3. Create a separate disposable Foundry v14 Starfinder 2e world. Back up any existing installation of this module ID before replacing it. Do not test against the live campaign first.
4. Enable the module and reload. Create a separate ordinary Player account for visibility checks.
5. Open Game Settings > Configure Settings > Module Settings > Greene Gaming: Murder in Metal City Add-Ons > Open Adventure Manager.

Forge import guidance: https://forums.forge-vtt.com/t/how-to-export-worlds-and-compendium-modules-from-the-forge/5518

## Test checklist

### Phase A — load and import (stop if broken)
- [ ] Module appears and enables without console errors; manager opens.
- [ ] Import each scene separately; correct images, gridless dimensions, and courtroom foreground appear.
- [ ] No automatic player activation; repeat imports do not duplicate or overwrite.
- [ ] GM View opens scenes; manually activate for player checks.
- [ ] Player cannot access GM controls.

### Phase B — investigation and permissions
- [ ] Create a sample draft with fictional findings and distinctive secret GM note.
- [ ] Ordinary player cannot read the draft, its pages or private fields. Verify through journal sidebar and player document access, not just UI labels.
- [ ] Publish; only public findings and image accessible. Draft edits do not update the public snapshot.
- [ ] Place two published clues in board slots; inspect pin as player, replace and clear slot.
- [ ] Set subject portrait and name; inspect layout and player visibility.
- [ ] Reconnect both clients and confirm persistence.

### Phase C — Machine Court
- [ ] Import all nine journals; repeat import preserves custom edits. Player cannot read GM notes.
- [ ] Director installs 14 lights, repair avoids duplication; test individual speakers and proceedings cues.
- [ ] Reset restores original darkness and global illumination; unrelated manual light remains unchanged.
- [ ] Place transparent counsel art, select actor image, mirror and resize; foreground occlusion and spotlight look correct to player.
- [ ] Replace and dismiss a witness without modifying actors or unrelated tiles.
- [ ] Present a published clue from Phase B; inspect same journal as player.
- [ ] Admit, clear, re-present, withdraw admission; numbering and count remain consistent.
- [ ] Set optional target, verify no automatic verdict. Open private trial record.
- [ ] Withdraw evidence publication; all tagged board and court placements disappear. Historical record remains private and unavailable evidence excluded from current count.

### Phase D — chase
- [ ] Initialize overlays before activating scene; covers and markers align with art.
- [ ] Enter fictional CP requirements, save, award/subtract points, move party and drone separately.
- [ ] Party arrival reveals correct obstacle; target reached does not force movement.
- [ ] Round, cover/reveal, reset confirmation and repair work; requirements survive reset.
- [ ] Reload both clients; state and rendered overlays persist.

### Phase E — report
Record Foundry exact build, SF2e version, browser, Forge import method, expected/actual behavior and screenshot or copied console stack trace. Check browser developer console (F12 on desktop); redact tokens, signed URLs and private campaign details. Test with only this module and required system initially. Re-enable other modules afterward to identify conflicts.

Stop on permission leaks, cross-scene edits, missing assets, or module loading errors. Do not move to the production campaign until those issues are corrected. No public release or manifest installation is available yet.
