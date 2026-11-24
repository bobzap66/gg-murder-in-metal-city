const MODULE_ID = 'gg-murder-in-metal-city';
Hooks.once('ready', () => {
  if (game.user?.isGM) console.info(`${MODULE_ID} | Development scaffold loaded; no features installed.`);
});
