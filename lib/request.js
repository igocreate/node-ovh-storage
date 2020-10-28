


const axios   = require('axios').default;

const responseError = (res) => {
  if (!res) {
    return 'no response';
  }
  if (res.statusCode && res.statusCode < 200 || res.statusCode >= 300) {
    return [res.statusCode, res.statusMessage].join(' ');
  }
  if (res.data && res.data.error) {
    return callback(res.data.error.message);
  }
};

module.exports = (options, callback) => {

  axios(options)
    .then(res => {
      const err = responseError(res);
      if (err) {
        return callback(err);
      }
      callback(err, res.data, res);
    })
    .catch(err => {
      // console.log(err);
      return callback(err);
    });

};