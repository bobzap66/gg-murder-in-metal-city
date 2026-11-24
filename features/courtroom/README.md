# Machine Court Director

Import Machine Court in the Adventure Manager and open Director next to the imported scene. View the courtroom as GM, or activate it through the normal Foundry scene interface when ready to show players. No activation is automatic.

Install / repair lights creates only missing tagged AmbientLight documents on the initial scene level. The first non-reset cue also installs missing lights. The fourteen positions are measured relative to the original backdrop and converted from pixels to scene distance units. Existing lights can be moved and tuned in Foundry; repair does not reset their positions or configuration. Use a single GM client to operate the director.

The first lighting cue saves the original darkness level and global-light enabled state in the scene's module flags. Cues set darkness and turn off global illumination, then show the selected managed lights. Reset hides those lights and restores the captured ambient values. Other lights and scene content are not changed. The cues persist as shared scene changes, not client-only effects. If a cue fails midway, Reset can restore the stored ambient baseline. Reset is not an undo for manually added lighting or custom scene edits.

The default spotlight radius and intensity are starting values, not yet verified in the Foundry renderer. Check all cues in a v14 test world, adjust positions and intensity if necessary, and verify visibility with a connected player. Use a scene with unlocked darkness. The current cue label reflects the last applied preset, not manual light edits.

GM macro: `await game.modules.get("gg-murder-in-metal-city").api.openCourtDirector();` (selects the viewed tagged courtroom or the only imported courtroom). Pass a scene ID explicitly if necessary.

Counsel artwork, journals, evidence projection and ambience are not included in this step. Prosecution and defense cues use neutral labels to accommodate GM-supplied characters.
