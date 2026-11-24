/** Foundry v14 tile coordinates identify the texture anchor, not necessarily the top-left. */
export function topLeftTexture(src,extra={}){
  return {src,...extra,anchorX:0,anchorY:0};
}
export function tileTopLeft(tile){
  return {x:tile.x-tile.width*(tile.texture?.anchorX??0),y:tile.y-tile.height*(tile.texture?.anchorY??0)};
}
export function topLeftPatch(rect){
  return {...rect,"texture.anchorX":0,"texture.anchorY":0};
}
