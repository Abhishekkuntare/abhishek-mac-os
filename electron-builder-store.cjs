const baseConfig = require('./electron-builder.json');

const requiredSettings = {
  APPX_IDENTITY_NAME: process.env.APPX_IDENTITY_NAME || 'AbhishekKuntare.AbhishekOS',
  APPX_PUBLISHER: process.env.APPX_PUBLISHER || 'CN=03596C97-E693-49A7-93D8-765D130ED2D0',
  APPX_PUBLISHER_DISPLAY_NAME: process.env.APPX_PUBLISHER_DISPLAY_NAME || 'Abhishek Kuntare',
};

const missingSettings = Object.entries(requiredSettings)
  .filter(([, value]) => !value?.trim())
  .map(([name]) => name);

if (missingSettings.length > 0) {
  throw new Error(
    `Microsoft Store package identity is not configured. Set ${missingSettings.join(', ')} from the identity values shown in Partner Center.`,
  );
}

const config = {
  ...baseConfig,
  win: {
    ...baseConfig.win,
    target: ['appx'],
  },
  appx: {
    identityName: requiredSettings.APPX_IDENTITY_NAME,
    publisher: requiredSettings.APPX_PUBLISHER,
    publisherDisplayName: requiredSettings.APPX_PUBLISHER_DISPLAY_NAME,
    applicationId: 'AbhishekOS',
    backgroundColor: '#070c1a',
    displayName: 'ARLO OS',
    languages: ['en-US'],
  },
};

delete config.publish;

module.exports = config;
