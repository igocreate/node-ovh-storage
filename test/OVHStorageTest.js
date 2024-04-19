require('dotenv').config();

const fs          = require('fs');
const assert      = require('assert');
const _           = require('lodash');
const OVHStorage  = require('../lib/OVHStorage');

const TEST_CONTAINER = 'Test-Container';

const config = {
  authURL:  'https://auth.cloud.ovh.net/v3',
  username: process.env.OVH_STORAGE_USERNAME,
  password: process.env.OVH_STORAGE_PASSWORD,
  tenantId: process.env.OVH_STORAGE_TENANTID,
  region:   process.env.OVH_STORAGE_REGION
};


// Test OVHStorage
describe('OVHStorage', () => {

  it('should get a valid token', async () => {
    const ovhstorage = new OVHStorage(config);
    await ovhstorage.initToken();
    assert.notStrictEqual(ovhstorage.token, undefined);
    assert.notStrictEqual(ovhstorage.endpoint, undefined);
    assert.strictEqual(ovhstorage.endpoint.region, config.region);
  });

  it('should get files list', async () => {
    const ovhstorage = new OVHStorage(config);
    const files = await ovhstorage.getFileList('');
    assert.strictEqual(_.isArray(files), true);
  });

  it('should create and delete a container', async () => {
    const ovhstorage = new OVHStorage(config);

    await ovhstorage.createContainer(TEST_CONTAINER);
    const files = await ovhstorage.getFileList('/' + TEST_CONTAINER);
    assert.strictEqual(_.isArray(files), true);
    assert.strictEqual(files.length, 0);

    await ovhstorage.deleteFile('/' + TEST_CONTAINER);
  });

  it('should put a file in a new container, read it and delete it', async () => {
    const ovhstorage = new OVHStorage(config);
    await ovhstorage.initToken();
    await ovhstorage.createContainer(TEST_CONTAINER);
    await ovhstorage.putFile('./README.md', '/' + TEST_CONTAINER + '/README.md');
    const files = await ovhstorage.getFileList('/' + TEST_CONTAINER);
    assert.strictEqual(_.isArray(files), true);
    assert.strictEqual(files.length, 1);
    const data = await ovhstorage.getFile('/' + TEST_CONTAINER + '/README.md');
    assert.strictEqual(data.toString('utf8'), fs.readFileSync('./README.md', { encoding: 'utf8' }));
    await ovhstorage.deleteFile('/' + TEST_CONTAINER + '/README.md');
    await ovhstorage.deleteFile('/' + TEST_CONTAINER);
  });
});
