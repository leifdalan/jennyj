var express = require('express'),
  http = require('http'),
  fs = require('fs'),
  path = require('path'),
  __parentDir = process.env.NODE_ENV ? '' : path.dirname(process.mainModule.filename),
  gm = require('gm'),
  imageMagick = gm.subClass({ imageMagick: true }),
  knox = require('knox'),
  Q = require('q'),
  crypto = require('crypto'),
  monk = require('monk'),
  AWSKEY = process.env.AWSKEY || require('../local-config').AWSKEY,
  AWSSECRET = process.env.AWSSECRET || require('../local-config').AWSSECRET,
  BUCKET = process.env.BUCKET || require('../local-config').BUCKET,
  mongoURI = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'localhost:27017/jennyjtest';
console.log(mongoURI);
var db = monk(mongoURI);
  db_images = db.get('images');

console.log(db);



exports.balls = function(req, res) {
  var sizes = [
      500,
      320,
      100
    ],
    deferredArray = [],
    record = {};

  if (req.files.displayImage.length) {
    for (var i = 0; i < req.files.displayImage.length; i++) {
      handleUpload(req.files.displayImage[i]);
    };
  } else {
    handleUpload(req.files.displayImage)  
  }
  

  function handleUpload(file) {
    fs.readFile(file.path, function (err, data) {
      var newPath = __parentDir + "/tmp/" + file.originalFilename;
      function resizeAndPush(args) {

        var thumbPath = __parentDir + '/tmp/' + args.id + '_' + args.thumbSize + '_' + file.originalFilename;
        imageMagick(newPath)
          .resize(args.thumbSize)
          .write(thumbPath, function(err) {
            
            var amazonPath = '/tmp/' + args.id + '_' + args.thumbSize + '_' + file.originalFilename
            console.log(amazonPath);
            var client = knox.createClient({
              key : AWSKEY,
              secret : AWSSECRET,
              bucket : BUCKET

            });
            var putting = client.putFile(thumbPath, amazonPath, function(err, s3res) {
              console.log('err:');
              console.log(err);
              if (!s3res) return args.deferred.reject(err);
              else s3res.resume(); 
              record[args.id]['s_' + args.thumbSize] = amazonPath;
              args.deferred.resolve(record);
              console.log(record);
            });

            putting.on('progress', function(written) {
              console.log(written);
              
            })
            putting.on('error', function(error) {
              console.log(error);

            })
        });//imageMagick
      }

      fs.writeFile(newPath, data, function (err) {

        var id = crypto.randomBytes(4).toString('hex'); 
        record[id] = {};
        for (var i = 0; i < sizes.length; i++) {
          var deferred = Q.defer();
          var args = {
            id : id,
            deferred : deferred,
            thumbSize : sizes[i]
          }
          
          resizeAndPush(args);

          deferredArray.push(args.deferred.promise);
        };//for sizes
        Q.allSettled(deferredArray).then(function(responseArray) {
          console.log(responseArray);
          res.end();
          db_images.insert(record);
        });
      });//writeFile
    });//readFile
  }//handleUpoad

}//balls