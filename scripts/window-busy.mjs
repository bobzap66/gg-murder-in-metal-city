/** Disable only module action buttons within our content sections, never Foundry window chrome.
 * Return a restoration callback that preserves previously disabled controls.
 */
export function disableContentActions(element){
  const buttons=Array.from(element?.querySelectorAll(".gg-mimc-manager button[data-action], .gg-mimc-director button[data-action]")??[]);
  const previous=buttons.map(button=>[button,button.disabled]);
  for(const [button] of previous)button.disabled=true;
  return ()=>{for(const [button,disabled] of previous)button.disabled=disabled;};
}
