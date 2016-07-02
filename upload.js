var fs = require('fs');
var resolve = require('path').resolve;
var request = require('https').request;
var config = require('./config');
var authToken = config.username + ':' + config.password;

function upload(config, modules) {
  var options = {
    hostname: 'screeps.com',
    port: 443,
    path: config.ptr ? '/ptr/api/user/code' : '/api/user/code',
    method: 'POST',
    auth: authToken,
    headers: {
     'Content-Type': 'application/json; charset=utf-8'
    }
  };

  var data = {
    branch: config.branch,
    modules: modules
  }

  var req = request(options, responseHandler);
  req.write(JSON.stringify(data))
  req.end();
}

function responseHandler(res) {
  if (res.statusCode === 200) {
    res.on('data', function (chunk) {
      chunk = chunk.toString('utf8');

      try {
        chunk = JSON.parse(chunk);
      } catch (err) {
        throw err;
      }

      if (chunk.error) {
        console.log(chunk.error);
      } else {
        console.log('Upload successful.');
      }
    });
  } else {
    console.log('Failed to upload. Status Code ' + res.statusCode);
  }
}

var modules = {};
var files = fs.readdirSync(resolve(__dirname, config.directory))
  .filter(function (file) {
    return /\.js$/.test(file);
  })
  .forEach(function (file) {
    var contents = fs.readFileSync(
      resolve(__dirname, config.directory, file),
      {encoding: 'utf8'}
    );

    modules[file.slice(0, -3)] = contents;
  });

upload(config, modules);
