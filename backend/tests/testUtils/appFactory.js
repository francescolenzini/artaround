const { startInMemoryMongo } = require('./mongoServer');

function purgeCache(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
}

async function buildTestApp() {
  await startInMemoryMongo();

  purgeCache('../../src/config/env');
  purgeCache('../../src/config/db');
  purgeCache('../../src/app');

  const { buildApp } = require('../../src/app');
  return buildApp();
}

module.exports = {
  buildTestApp,
};
