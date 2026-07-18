const mongoose = require('mongoose');

const { connectDb } = require('../../src/config/db');
const { clearDatabase, disconnectDatabase } = require('../testUtils/dbHelpers');
const { startInMemoryMongo, stopInMemoryMongo } = require('../testUtils/mongoServer');

async function runSeed() {
  delete require.cache[require.resolve('../../src/scripts/seed')];
  const seed = require('../../src/scripts/seed');
  await seed();
}

describe('seed idempotence', () => {
  beforeAll(async () => {
    await startInMemoryMongo();
    delete require.cache[require.resolve('../../src/config/env')];
    delete require.cache[require.resolve('../../src/config/db')];
    await connectDb();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await stopInMemoryMongo();
  });

  it('keeps Uffizi stable across repeated runs', async () => {
    await runSeed();

    const Museum = mongoose.model('Museum');
    const firstRunMuseums = await Museum.find({ slug: 'galleria-degli-uffizi' }).lean();

    expect(firstRunMuseums).toHaveLength(1);

    const firstId = firstRunMuseums[0].id;

    await runSeed();

    const secondRunMuseums = await Museum.find({ slug: 'galleria-degli-uffizi' }).lean();
    expect(secondRunMuseums).toHaveLength(1);
    expect(secondRunMuseums[0].id).toBe(firstId);
  });
});