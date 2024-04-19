
const fs          = require('fs');
const _           = require('lodash');
const axios       = require('axios').default;


class OVHStorage {
  constructor(config) {
    this.config = config || {};
  }

  // @deprecated
  async getToken() {
    console.warn('getToken() is deprecated, use initToken() instead');
  }

  // POST /tokens
  async initToken() {
    const url = `${this.config.authURL}/auth/tokens`;
    const json = {
      auth: {
        identity: {
          methods: ['password'],
          password: {
            user: {
              name:     this.config.username,
              domain:   { name: 'Default' },
              password: this.config.password
            }
          },
          tenantId: this.config.tenantId
        }
      }
    };

    const res = await axios({
      method: 'POST',
      url,
      headers: { 'Accept': 'application/json' },
      data: json,
    });

    this.token            = res.headers['x-subject-token'];
    const serviceCatalog  = _.find(res.data.token.catalog, { type: 'object-store' });
    this.endpoint         = _.find(serviceCatalog.endpoints, { region: this.config.region });

    if (!this.endpoint) {
      const possibleRegions = _.map(serviceCatalog.endpoints, 'region');
      throw new Error(`No endpoint for region ${this.config.region} found! Possible regions are ${possibleRegions.join(',')}.`);
    }

  }

  /**
   * Returns the a file list of the given folder
   * @param {string} folderPath path of the folder
   */
  async getFileList(folderPath) {
    if (!this.token) {
      await this.initToken();
    }
    const url = `${this.endpoint.url}${folderPath}`;
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'X-Auth-Token': this.token,
        'Accept': 'application/json'
      }
    });
    return res.data;
  }

  /**
   * Download the file from the given path.
   * The return value is a buffer of the file
   * @param {string} path Path to the file
   */
  async getFile(path) {
    if (!this.token) {
      await this.initToken();
    }
    const url = `${this.endpoint.url}${path}`;
    const res = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      headers: {
        'X-Auth-Token': this.token,
        'Accept': 'application/octet-stream'
      }
    });
    return res.data;
  }

  // PUT /path : upload file
  async putFile(file, path, headers = {}) {
    if (!this.token) {
      await this.initToken();
    }
    const stream = fs.createReadStream(file);
    return await this.putStream(stream, path, headers);
  }

  // PUT /path : upload file
  async putStream(stream, path, headers = {}) {
    if (!this.token) {
      await this.initToken();
    }
    const url = `${this.endpoint.url}${path}`;
    headers = {
      ...headers,
      'X-Auth-Token': this.token,
      'Accept': 'application/json',
      'content-type': 'application/octet-stream'
    };

    const res = await axios({
      method: 'PUT',
      url,
      headers,
      data: stream,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return res.data;
  }

  // DELETE /path : delete file
  async deleteFile(path, headers = {}) {
    if (!this.token) {
      await this.initToken();
    }
    const url = `${this.endpoint.url}${path}`;
    headers = {
      ...headers,
      'X-Auth-Token': this.token,
      'Accept': 'application/json'
    };

    const res = await axios({
      method: 'DELETE',
      url,
      headers
    });
    return res.data;
  }

  // CREATE /container : create container
  async createContainer(container) {
    if (!this.token) {
      await this.initToken();
    }
    const url = `${this.endpoint.url}/${container}`;
    const res = await axios({
      method: 'PUT',
      url,
      headers: {
        'X-Auth-Token': this.token,
        'Accept': 'application/json'
      }
    });
    return res.data;
  }
}

module.exports = OVHStorage;
