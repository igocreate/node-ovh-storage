
'use strict';

var fs        = require('fs');

var _         = require('lodash');
var request   = require('request');

//
class OVHStorage {

  constructor(config) {
    this.config = config;
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
    var _this = this;

    var json = {
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
      uri:      this.config.authURL + '/auth/tokens',
      json:     json,
      headers:  { 'Accept': 'application/json' },
      encoding: null
    }, function(err, res, body) {
      err = err || _this.responseErr(res);
      if (err) {
        return callback(err);
      }
      if (body.error) {
        return callback(body.error.message);
      }

      var token           = res.headers['x-subject-token'];
      var serviceCatalog  = _.find(body.token.catalog, { type: 'object-store' });
      var endpoint        = _.find(serviceCatalog.endpoints, { region: _this.config.region });

      if (!endpoint) {
        const possibleRegions = [];
        serviceCatalog.endpoints.forEach(function (endpoint) {
          possibleRegions.push(endpoint.region);
        }, this);
        return callback(new Error(`No endpoint for region ${_this.config.region} found! Possible regions are: ${possibleRegions.join(',')}`))
      }

      _this.token     = token;
      _this.endpoint  = endpoint;

      callback(null, token, endpoint);
    })
  }

  /**
   * Returns the a file list of the given folder
   * @param {string} folderPath path of the folder
   * @param {Function} callback
   */
  getFileList(folderPath, callback) {
    var _this     = this;
    var targetURL = this.endpoint.url + folderPath;
    request({
      method:   'GET',
      uri:      targetURL,
      json:     true,
      headers:  {
        "X-Auth-Token": this.token,
        "Accept": "application/json"
      }
    }, function (err, res, body) {
      err = err || _this.responseErr(res);
      if (err) {
        return callback(err);
      }
      callback(err, body);
    });
  }

  /**
   * Download the file from the given path.
   * The return value is a buffer of the file
   * @param {string} path Path to the file
   * @param {Function} callback
   */
  getFile(path, callback) {
    var _this     = this;
    var targetURL = this.endpoint.url + path;
    request({
      method:   'GET',
      uri:      targetURL,
      encoding: null,
      headers:  {
        "X-Auth-Token": this.token,
        "Accept": "application/json"
      }
    }, function (err, res, body) {
      err = err || _this.responseErr(res);
      if (err) {
        return callback(err);
      }
      callback(err, body);
    });
  }

  getFiles(path, callback) {
    console.warn('*deprecated*: you should use the `getFile()` method');
    return this.getFile(path, callback);
  }

  // PUT /path : upload file
  putFile(file, path, headers, callback) {
    if (_.isFunction(headers)) {
      callback  = headers;
      headers   = {};
    }

    var stream = fs.createReadStream(file);
    return this.putStream(stream, path, headers, callback);
  }

  // PUT /path : upload file
  putStream(stream, path, headers, callback) {
    var _this     = this;
    var targetURL = this.endpoint.url + path;

    if (_.isFunction(headers)) {
      callback  = headers;
      headers   = {};
    }
    headers = headers || {};

    Object.assign(headers, {
      "X-Auth-Token": this.token,
      "Accept": "application/json"
    });

    stream.pipe(request({
      method:   'PUT',
      uri:      targetURL,
      headers:  headers,
      encoding: null
    }, function (err, res, body) {
      err = err || _this.responseErr(res);
      if (err) {
        return callback(err);
      }
      callback(err, body);
    }));
  }

  // DELETE /path : delete file
  deleteFile(path, headers, callback) {
    var _this     = this;
    var targetURL = this.endpoint.url + path;

    if (_.isFunction(headers)) {
      callback  = headers;
      headers   = {};
    }
    headers = headers || {};

    Object.assign(headers, {
      "X-Auth-Token": this.token,
      "Accept": "application/json"
    });

    request({
      method:   'DELETE',
      uri:      targetURL,
      encoding: null,
      headers:  headers
    }, function (err, res, body) {
      err = err || _this.responseErr(res);
      if (err) {
        return callback(err);
      }
      callback(err, body);
    });
  }

  //
  createContainer(container, callback) {
    var _this = this;
    var targetURL = this.endpoint.url + '/' + container;

    request({
      method:   'PUT',
      uri:      targetURL,
      encoding: null,
      headers: {
        "X-Auth-Token": _this.token,
        "Accept":       "application/json"
      }
    }, function (err, res, body) {
      err = err || _this.responseErr(res);
      if (err) {
        return callback(err);
      }
      callback(err, body);
    });
  }
}

module.exports = OVHStorage;
