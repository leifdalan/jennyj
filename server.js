var express = require('express'),
  env = process.env.NODE_ENV || 'development',
  logfmt = require('logfmt'),
  less = require('less'),
  lessMiddleware = require('less-middleware'),
  path = require('path'),
  config = require('./config')[env],
  mongo = require('mongodb'),
  http = require('http'),
  monk = require('monk'),
  mongoURI = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'localhost:27017/jennyjtest',
  routes = require('./routes'),
  S3PATH = 'https://jennytest.s3.amazonaws.com'

var app = express();
//app.use(logfmt.requestLogger());z
var db = monk(mongoURI);
  db_images = db.get('images');


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
  db_images.find({}, {sort: {'_id' : -1}}, function(e, docs) {
    console.log(e);
    console.log(docs);
    res.render('index', {
      images : docs
    });    
  })


});

app.post('/balls', routes.balls);