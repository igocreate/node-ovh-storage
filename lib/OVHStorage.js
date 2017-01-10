
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
        passwordCredentials: {
          username: this.config.username,
          password: this.config.password
        },
        tenantId: this.config.tenantId
      }
    };
    request({
      method:   'POST',
      uri:      this.config.authURL + '/tokens',
      json:     json,
      headers:  { 'Accept': 'application/json' }
    }, function(err, res, body) {
      err = err || _this.responseErr(res);
      if (err) {
        return callback(err);
      }
      if (body.error) {
        return callback(body.error.message);
      }

      var token           = body.access.token;
      var serviceCatalog  = _.find(body.access.serviceCatalog, { type: 'object-store' });
      var endpoint        = _.find(serviceCatalog.endpoints, { region: _this.config.region });

      _this.token     = token;
      _this.endpoint  = endpoint;

      callback(null, token, endpoint);
    })
  }

  // GET /path : list files
  getFiles(path, callback) {
    var _this     = this;
    var targetURL = this.endpoint.publicURL + path;
    request({
      method: 'GET',
      uri: targetURL,
      headers: {
        "X-Auth-Token": this.token.id,
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

  // PUT /path : upload file
  putFile(file, path, callback) {
    var _this     = this;
    var targetURL = this.endpoint.publicURL + path;

    var headers = {
      "X-Auth-Token": this.token.id,
      "Accept": "application/json"
    };

    fs.createReadStream(file).pipe(request({
      method:   'PUT',
      uri:      targetURL,
      headers:  headers
    }, function (err, res, body) {
      err = err || _this.responseErr(res);
      if (err) {
        return callback(err);
      }
      callback(err, body);
    }));
  }
}

module.exports = OVHStorage;
