const baseConfig = require('./electron-builder.json');

module.exports = {
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
