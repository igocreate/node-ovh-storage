

const fs      = require('fs');
const _       = require('lodash');

const request = require('./request');


//
class OVHStorage {

  constructor(config) {
    this.config = config || {};
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
    request({
      method:   'POST',
      url,
      headers:  { 'Accept': 'application/json' },
      data:     json,
    }, (err, data, res) => {
      if (err) {
        return callback(err);
      }

      const token           = res.headers['x-subject-token'];
      const serviceCatalog  = _.find(data.token.catalog, { type: 'object-store' });
      const endpoint        = _.find(serviceCatalog.endpoints, { region: this.config.region });

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
    });
  }

  /**
   * Returns the a file list of the given folder
   * @param {string} folderPath path of the folder
   * @param {Function} callback
   */
  getFileList(folderPath, callback) {
    const url = this.endpoint.url + folderPath;
    request({
      method: 'GET',
      url,
      headers:  {
        'X-Auth-Token': this.token,
        'Accept': 'application/json'
      }
    }, callback);
  }

  /**
   * Download the file from the given path.
   * The return value is a buffer of the file
   * @param {string} path Path to the file
   * @param {Function} callback
   */
  getFile(path, callback) {
    const url = this.endpoint.url + path;
    request({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      headers: {
        'X-Auth-Token': this.token,
        'Accept': 'application/octet-stream'
      }
    }, callback);
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

    request({
      method: 'PUT',
      url, headers,
      data: stream,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }, callback);
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

    request({
      method: 'DELETE',
      url, headers
    }, callback);
  }

  //
  createContainer(container, callback) {
    const url = this.endpoint.url + '/' + container;

    request({
      method: 'PUT',
      url,
      headers: {
        'X-Auth-Token': this.token,
        'Accept':       'application/json'
      }
    }, callback)
  }
}

module.exports = OVHStorage;
