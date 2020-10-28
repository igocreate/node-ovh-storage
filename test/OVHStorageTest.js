
// To run this test, put your config in .env
// 
// OVH_STORAGE_USERNAME=XXX
// OVH_STORAGE_PASSWORD=XXX
// OVH_STORAGE_TENANTID=XXX
// OVH_STORAGE_REGION=XXX

require('dotenv').config();


const fs          = require('fs');
const assert      = require('assert');

const _           = require('lodash');
const OVHStorage  = require('../lib/OVHStorage');


const TEST_CONTAINER = 'Test-Container';


//
describe('OVHStorage', function() {

  const config = {
    authURL:          'https://auth.cloud.ovh.net/v3',
    username:         process.env.OVH_STORAGE_USERNAME,
    password:         process.env.OVH_STORAGE_PASSWORD,
    tenantId:         process.env.OVH_STORAGE_TENANTID,
    region:           process.env.OVH_STORAGE_REGION
  };

  //
  it('should get a valid token', function(done) {
    const ovhstorage = new OVHStorage(config);
    ovhstorage.getToken((err, token, endpoint) => {
      // console.log({err, token, endpoint});
      assert.strictEqual(err, null);
      assert.notStrictEqual(token, undefined);
      assert.notStrictEqual(endpoint, undefined);
      assert.strictEqual(endpoint.region, config.region);
      done();
    })
  });

  //
  it('should get files list', function(done) {
    const ovhstorage = new OVHStorage(config);
    ovhstorage.getToken(() => {
      // list containers
      ovhstorage.getFileList('', (err, files) => {
        // console.log(err, files);
        assert.strictEqual(_.isArray(files), true);
        done();
      });
    });
  });

  //
  it('should create and delete a container', function(done) {
    const ovhstorage = new OVHStorage(config);
    ovhstorage.getToken(() => {
      // create container
      ovhstorage.createContainer(TEST_CONTAINER, (err, data) => {
        // console.log(err, data);
        assert.strictEqual(err, undefined);

        // get files in container
        ovhstorage.getFileList('/' + TEST_CONTAINER, (err, files) => {
          // console.log(err, files);
          assert.strictEqual(err, undefined);
          assert.strictEqual(_.isArray(files), true);
          assert.strictEqual(files.length, 0);

          // delete container
          ovhstorage.deleteFile('/' + TEST_CONTAINER, (err, data) => {
            // console.log(err, data);
            assert.strictEqual(err, undefined);            
            done();
          });
        });
      });
    });
  });


  //
  it('should put a file in a new container, read it and delete it', function(done) {
    const ovhstorage = new OVHStorage(config);
    ovhstorage.getToken(() => {

      // create container
      ovhstorage.createContainer(TEST_CONTAINER, (err, data) => {
        // console.log(err, data);
        assert.strictEqual(err, undefined);

        // put file
        ovhstorage.putFile('./README.md', '/' + TEST_CONTAINER + '/README.md', (err, data) => {

          assert.strictEqual(err, undefined);
        
          // get files in container
          ovhstorage.getFileList('/' + TEST_CONTAINER, (err, files) => {
            // console.log(err, files);
            assert.strictEqual(err, undefined);
            assert.strictEqual(_.isArray(files), true);
            assert.strictEqual(files.length, 1);

            // get file in container
            ovhstorage.getFile('/' + TEST_CONTAINER + '/README.md', (err, data) => {
              assert.strictEqual(err, undefined);
              assert.strictEqual(data.toString('utf8'), fs.readFileSync('./README.md', { encoding: 'utf8' }));

              // delete file
              ovhstorage.deleteFile('/' + TEST_CONTAINER + '/README.md', (err, data) => {
                // console.log(err, data);
                assert.strictEqual(err, undefined);
                
                // delete container
                ovhstorage.deleteFile('/' + TEST_CONTAINER, (err, data) => {
                  // console.log(err, data);
                  assert.strictEqual(err, undefined);            
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

});