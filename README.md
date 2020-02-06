# node-ovh-storage
A simple Node.js library to connect to the Object Storage OVH service

## Install via npm

```js
npm install node-ovh-storage --save
```

## API Usage

```js

var OVHStorage = require('node-ovh-storage');

var config = {
  username: 'username',
  password: 'password',
  authURL:  'https://auth.cloud.ovh.net/v3',
  tenantId: 'tenantId',
  region:   'GRA1'
};

var storage = new OVHStorage(config);
// init token
storage.getToken(function(err) {
  // create new container
  storage.createContainer('Storage-1', function() {
    // put file
    storage.putFile('./tmp/doc.pdf', '/Storage-1/doc.pdf', function(err, res) {
      // list files in container
      storage.getFiles('/Storage-1', function(err, files) {
        // done
      });
    });
  });
});
```
