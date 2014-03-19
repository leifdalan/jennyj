var express = require('express'),
  env = process.env.NODE_ENV || 'development',
  logfmt = require('logfmt'),
  less = require('less'),
  lessMiddleware = require('less-middleware'),
  path = require('path'),
  config = require('./config')[env],
  mongo = require('mongodb'),
  http = require('http');
  routes = require('./routes');

var app = express();
console.log(config);
//app.use(logfmt.requestLogger());z



var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.logger('dev'))
app.use(express.static(__dirname + '/public'))
app.use(express.methodOverride());
//bodyParser must be before router.... thanks docs.
app.use(express.bodyParser())
app.use(app.router);
//app.use(form({ keepExtensions: true }));
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
  res.render('index');
});

app.post('/balls', routes.balls);