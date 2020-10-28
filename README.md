# node-ovh-storage
A simple Node.js library to connect to the [Object Storage OVH service](https://www.ovhcloud.com/fr/public-cloud/object-storage/).



## Install via npm

```js
npm install node-ovh-storage
```

## API Usage

```js

var OVHStorage = require('node-ovh-storage');

var config = {
  authURL:  'https://auth.cloud.ovh.net/v3',
  username: 'username',
  password: 'password',
  tenantId: 'tenantId',
  region:   'GRA'
};

const storage = new OVHStorage(config);

// init token
storage.getToken((err) => {

  // create new container
  storage.createContainer('Container-1', () => {

    // put file
    storage.putFile('./tmp/doc.pdf', '/Container-1/doc.pdf', (err, res) => {

      // list files in container
      storage.getFileList('/Container-1', (err, files) => {

        // read file
        storage.getFile('/Container-1/doc.pdf', (err, file) => {
          
        });
      });
    });
  });
});
```
