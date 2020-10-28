

const fs      = require('fs');
const _       = require('lodash');

const axios   = require('axios').default;


//
class OVHStorage {

  constructor(config) {
    this.config = config || {};
  }

  responseErr(res) {
    if (!res) {
      return 'no response';
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return [res.statusCode, res.statusMessage].join(' ');
    }
    return null;
  }

  // POST /tokens
  getToken(callback) {
    const url = this.config.authURL + '/auth/tokens';
    const json = {
      auth: {
        identity: {
          methods: [
            "password"
          ],
          password: {
            user: {
              name: this.config.username,
              domain: {
                name: "Default"
              },
              password: this.config.password
            }
          },
          tenantId: this.config.tenantId
        }
      }
    };
    axios({
      method:   'POST',
      url,
      headers:  { 'Accept': 'application/json' },
      data:     json,
    })
    .then(res => {
      const err = this.responseErr(res);
      if (err) {
        return callback(err);
      }
      
      const { data } = res;
      if (data.error) {
        return callback(data.error.message);
      }

      var token           = res.headers['x-subject-token'];
      var serviceCatalog  = _.find(data.token.catalog, { type: 'object-store' });
      var endpoint        = _.find(serviceCatalog.endpoints, { region: this.config.region });

      if (!endpoint) {
        const possibleRegions = [];
        serviceCatalog.endpoints.forEach(function (endpoint) {
          possibleRegions.push(endpoint.region);
        }, this);
        return callback(new Error(`No endpoint for region ${this.config.region} found! Possible regions are: ${possibleRegions.join(',')}`))
      }

      this.token     = token;
      this.endpoint  = endpoint;

      callback(null, token, endpoint);
    })
    .catch(err => {
      // console.log(err);
      return callback(err);
    });
  }

  /**
   * Returns the a file list of the given folder
   * @param {string} folderPath path of the folder
   * @param {Function} callback
   */
  getFileList(folderPath, callback) {
    const url = this.endpoint.url + folderPath;
    axios({
      method: 'GET',
      url,
      headers:  {
        'X-Auth-Token': this.token,
        'Accept': 'application/json'
      }
    })
    .then(res => {
      const err = this.responseErr(res);
      if (err) {
        return callback(err);
      }
      
      const { data } = res;
      if (data.error) {
        return callback(data.error.message);
      }
      callback(err, data);
    })
    .catch(err => {
      // console.log(err);
      return callback(err);
    });
  }

  /**
   * Download the file from the given path.
   * The return value is a buffer of the file
   * @param {string} path Path to the file
   * @param {Function} callback
   */
  getFile(path, callback) {
    const url = this.endpoint.url + path;
    axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      headers: {
        'X-Auth-Token': this.token,
        'Accept': 'application/octet-stream'
      }
    })
    .then(res => {
      const err = this.responseErr(res);
      if (err) {
        return callback(err);
      }
      
      const { data } = res;
      if (data.error) {
        return callback(data.error.message);
      }
      callback(err, data);
    })
    .catch(err => {
      return callback(err);
    });
  }

  // PUT /path : upload file
  putFile(file, path, headers, callback) {
    if (_.isFunction(headers)) {
      callback  = headers;
      headers   = {};
    }
    const stream = fs.createReadStream(file);
    return this.putStream(stream, path, headers, callback);
  }

  // PUT /path : upload file
  putStream(stream, path, headers, callback) {
    const url = this.endpoint.url + path;
    if (_.isFunction(headers)) {
      callback  = headers;
      headers   = {};
    }
    headers = headers || {};

    Object.assign(headers, {
      'X-Auth-Token': this.token,
      'Accept': 'application/json',
      'content-type': 'application/octet-stream'
    });

    axios({
      method: 'PUT',
      url, headers,
      data: stream
    })
    .then(res => {
      const err = this.responseErr(res);
      if (err) {
        return callback(err);
      }
      const { data } = res;
      if (data.error) {
        return callback(data.error.message);
      }
      callback(err, data);
    })
    .catch(err => {
      // console.log(err);
      return callback(err);
    });
  }

  // DELETE /path : delete file
  deleteFile(path, headers, callback) {
    const url = this.endpoint.url + path;

    if (_.isFunction(headers)) {
      callback  = headers;
      headers   = {};
    }
    headers = headers || {};

    Object.assign(headers, {
      'X-Auth-Token': this.token,
      'Accept': 'application/json'
    });

    axios({
      method: 'DELETE',
      url, headers
    })
    .then(res => {
      const err = this.responseErr(res);
      if (err) {
        return callback(err);
      }
      callback(err, res.data);
    })
    .catch(err => {
      // console.log(err);
      return callback(err);
    });
  }

  //
  createContainer(container, callback) {
    const url = this.endpoint.url + '/' + container;

    axios({
      method: 'PUT',
      url,
      headers: {
        'X-Auth-Token': this.token,
        'Accept':       'application/json'
      }
    })
    .then(res => {
      const err = this.responseErr(res);
      if (err) {
        return callback(err);
      }
      
      const { data } = res;
      if (data.error) {
        return callback(data.error.message);
      }
      callback(err, data);
    })
    .catch(err => {
      // console.log(err);
      return callback(err);
    });
  }
}

module.exports = OVHStorage;
