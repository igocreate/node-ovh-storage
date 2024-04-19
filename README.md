# node-ovh-storage
A simple Node.js library to connect to the [Object Storage OVH service](https://www.ovhcloud.com/fr/public-cloud/object-storage/).



## Install via npm

```js
npm install node-ovh-storage
```

## API Usage

```js

const OVHStorage  = require('node-ovh-storage');

const config      = {
  authURL:    'https://auth.cloud.ovh.net/v3',
  username:   'username',
  password:   'password',
  tenantId:   'tenantId',
  region:     'GRA'
};

// test function
const test = async () => {

  const storage = new OVHStorage(config);

  // init token (optional)
  await storage.getToken();

  // create new container
  await storage.createContainer('Container-1');

  // put file
  await storage.putFile('./tmp/doc.pdf', '/Container-1/doc.pdf');

  // list files in container
  await storage.getFileList('/Container-1');

  // get file
  await storage.getFile('/Container-1/doc.pdf');

  // delete file
  await storage.deleteFile('/Container-1/doc.pdf');

};

test();

```
