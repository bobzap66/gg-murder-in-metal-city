# Machine Court Director

Import Machine Court in the Adventure Manager and open Director next to the imported scene. View the courtroom as GM, or activate it through the normal Foundry scene interface when ready to show players. No activation is automatic.

Install / repair lights creates only missing tagged AmbientLight documents on the initial scene level. The first non-reset cue also installs missing lights. The fourteen positions are measured relative to the original backdrop and converted from pixels to scene distance units. Existing lights can be moved and tuned in Foundry; repair does not reset their positions or configuration. Use a single GM client to operate the director.

The first lighting cue saves the original darkness level and global-light enabled state in the scene's module flags. Cues set darkness and turn off global illumination, then show the selected managed lights. Reset hides those lights and restores the captured ambient values. Other lights and scene content are not changed. The cues persist as shared scene changes, not client-only effects. If a cue fails midway, Reset can restore the stored ambient baseline. Reset is not an undo for manually added lighting or custom scene edits.

The default spotlight radius and intensity are starting values, not yet verified in the Foundry renderer. Check all cues in a v14 test world, adjust positions and intensity if necessary, and verify visibility with a connected player. Use a scene with unlocked darkness. Click the active lighting cue again to reset to normal. Explicit automatic focus on placement still applies the requested cue, even if already active. The current cue label reflects the last applied preset, not manual light edits.

GM macro: `await game.modules.get("gg-murder-in-metal-city").api.openCourtDirector();` (selects the viewed tagged courtroom or the only imported courtroom). Pass a scene ID explicitly if necessary.

Ambience remains to be implemented. Prosecution and defense cues use neutral labels to accommodate GM-supplied characters.

## GM journals and court roster

Open **Court officials** from the Adventure Manager or Director, then **Import missing journals**. This creates eight editable NPC entries plus a GM Hearing Guide in the Journal folder Greene Gaming — Machine Court. Each NPC has roleplaying notes, portrait and character card pages. Existing entries are recognized by a stable module flag and never overwritten. Missing entries can be restored independently. No actor or stat block is created. The Director offers a shortcut to the current official's journal once imported.

Journal entries start with default ownership None; pages inherit. Existing entries retain any permissions or edits you have assigned. Share only the portrait or card deliberately through Foundry, not the private roleplaying notes. The original bundled source is public and is not a mechanism for hiding campaign secrets. Use one GM client for imports.

Macro: `await game.modules.get("gg-murder-in-metal-city").api.openCourtRoster();`

These profiles and hearing guide are optional original GM material, not official adventure rules. No verdict or extra mechanics are prescribed. The journal importer has not yet been exercised in a live Foundry/Forge world.

## Exhibit presentation and trial register

Open **Exhibit control** from the Director, select a published evidence journal, and Present exhibit. The module uses the same artwork and journal as the investigation board; it creates only a tagged screen backing, aspect-fit image tile and journal pin, not a duplicate evidence entry. A rectangular display area is measured against the original courtroom; confirm its placement in Forge. Optional focus lighting invokes the existing evidence cue. Players can inspect the original journal through the pin or Journal sidebar. The controller never publishes private drafts.

Each first presentation assigns the next exhibit number, which remains stable for that published journal version. Presenting again reuses its number. Admit or Withdraw admission independently of the screen; Clear display restores the original background and leaves admissions unchanged. The optional target is a GM-supplied count, defaults to zero (disabled), and never determines the verdict. No official adventure mechanics are included. The private Trial Record journal is created per imported courtroom and stores exhibit history, actions and UTC timestamps; opening it refreshes its generated register page. Additional manually created pages are preserved; do not edit the generated page if you want your edits retained. This is an exhibit activity log, not a verbatim transcript.

Withdrawing evidence publication in the shared library removes all managed tiles and pins, including the courtroom screen. An unavailable exhibit stays in the historical record but is excluded from the current admission count. Refresh the controller or open the trial record to update availability. Republishing a revised draft creates a different journal version and therefore a new exhibit number. No destructive trial reset is provided yet. Use a separate imported/duplicated courtroom with its own scene ID for a separate trial, or archive the old trial record manually after clearing the display. Use one GM client for all library and courtroom operations. Scene objects and public journals are not secrecy mechanisms; never put private information in published fields.

Macro: `await game.modules.get("gg-murder-in-metal-city").api.openCourtExhibits();`

Live test: publish evidence, place on board, present in court, inspect as player, admit, clear, present again, withdraw admission, withdraw publication, refresh record and verify all placements are removed. Check the display geometry, lighting and journal permissions on The Forge.

## Counsel and witness placement

Open **Cast & witnesses** from the Director. Choose Prosecution, Defense or Witness platform. Enter a display name and select artwork through Foundry's native image picker (including Forge assets), paste an accessible image path, or copy the token/portrait image from an existing world actor. Full-body transparent PNG or WebP images are recommended. The module does not bundle published-character artwork and does not create or change actors, tokens, ownership, statistics or combatants.

Adjust the horizontal center, bottom baseline and height as percentages of the scene rectangle; artwork is aspect-fitted and clamped inside the scene. Mirror reverses the image horizontally. Default position restores the station's recommended geometry without changing the selected name or artwork. Place / update creates or updates the single managed tile for that station. A failed image load leaves an existing character untouched. The original desk foreground should occlude the lower part of counsel artwork; verify layer ordering and placement in a live v14 world. Existing geometry is read from the tile when the editor opens. For transparent images with large empty margins, crop the source or adjust the station geometry.

Once a character is placed, use directional arrows with fine (0.5%), normal (1%) or coarse (2%) increments, Smaller/Larger, or edit the numeric geometry fields and commit the field (Tab or click away). Geometry and mirror changes save directly to the tile. Name and image changes still require Place / update. Unlock & drag switches to Foundry's Tiles layer in the viewed courtroom and selects the tile for direct native dragging; the fields refresh after movement. Click Lock position when done, including before switching stations or closing the editor. Unlocked tiles remain unlocked until explicitly locked or replaced. These controls are shared scene updates.

Dismiss deletes only the tagged station tile(s), leaving the original scene and actor unchanged. Spotlight invokes the corresponding courtroom lighting cue; optional focus on placement does the same. Dismiss does not alter the current lighting cue; select another cue or Reset when ready. The next witness can be placed directly over the previous witness or after dismissal. No hidden witness tiles or private roster are stored on the public scene; any placed image and name are visible to scene viewers. Save before switching stations or refreshing; the editor is not a persistent witness queue. Use a single GM client.

Macro: `await game.modules.get("gg-murder-in-metal-city").api.openCourtCast();`

Live test: place both counsel, select a witness, verify aspect ratio and foreground occlusion as a player, mirror and resize, spotlight, replace witness, dismiss, confirm unrelated tiles and actors are unchanged. Test Forge's asset picker and URL loading.
