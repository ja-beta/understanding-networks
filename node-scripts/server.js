var express = require('express');         // include express.js
var server = express();			  // a local instance of it
var bodyParser = require('body-parser');  // include body-parser
var proxyLocation = '/';            // the proxy location from nginx

// Import the config file
var config = require('./config');

server.use(express.static('public'));

// Endpoint to serve the config data
server.get('/config', (req, res) => {
    res.json(config);
});

// this runs after the server successfully starts:
function serverStart() {
  var port = this.address().port;
  console.log('Server listening on port ' + port);
}

function handleGet(request, response) {
  // send the response:
  response.send("hello, you sent me a GET request");
  response.end();
}

function handlePost(request, response) {
  console.log('Got a POST request');
  response.send("hello, you sent me a POST request");
  response.end();
}

// this is the callback function for when the client
// requests the date (a dynamic route):
function handleDate(request, response) {
  console.log('You sent a GET request for the date');
  // send the response:
  var now = new Date();
  response.send("Date: " + now + "\n");
  response.end();
}

// start the server:
server.listen(8080, serverStart);
server.get(proxyLocation, handleGet);    // GET request listener
server.get(proxyLocation + '/data', handleGet);    // GET request listener
server.get(proxyLocation + '/date', handleDate);   // GET request listener
server.post(proxyLocation + '/data', handlePost);  // POST request listener