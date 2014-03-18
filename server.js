var express = require('express'),
  env = process.env.NODE_ENV || 'development',
  logfmt = require('logfmt'),
  less = require('less'),
  lessMiddleware = require('less-middleware'),
  path = require('path'),
  config = require('./config')[env],
  mongo = require('mongodb'),
  http = require('http');
  //routes = require('./routes'),

var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.send('Bawlz!');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});