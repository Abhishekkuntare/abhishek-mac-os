const baseConfig = require('./electron-builder.json');

const config = {
  ...baseConfig,
  extraResources: [],
  mac: {
    category: 'public.app-category.productivity',
    icon: 'build/mac/icon.icns',
    identity: null,
    target: ['dmg', 'zip'],
  },
  dmg: {
    artifactName: 'ARLO-OS-${version}-mac-${arch}.${ext}',
  },
  artifactName: 'ARLO-OS-${version}-mac-${arch}.${ext}',
};

delete config.publish;

module.exports = config;
