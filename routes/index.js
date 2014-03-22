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
  keys = process.env.NODE_ENV ? process.env : require('../local-config');
  AWSKEY = process.env.AWSKEY || require('../local-config').AWSKEY,
  AWSSECRET = process.env.AWSSECRET || require('../local-config').AWSSECRET,
  BUCKET = process.env.BUCKET || require('../local-config').BUCKET,
  mongoURI = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'localhost:27017/jennyjtest',
  cloudinary = require('cloudinary'),
  S3PATH = 'https://jennyjtest.s3.amazonaws.com';
  CLOUDFRONT_PATH = 'https://d3dd7n94czsagf.cloudfront.net';

var db = monk(mongoURI);
  db_images = db.get('images');

cloudinary.config({ 
  cloud_name: keys.CLOUD_NAME, 
  api_key: keys.CLOUD_API_KEY, 
  api_secret: keys.CLOUD_SECRET 
});

var record = [];

var sizes = [
  {
    width: 500,
    crop : 'fill',
    gravity : 'face'
  },
  {
    width: 1000,
    crop : 'fill',
    gravity : 'face'
  },
  {
    width: 100,
    height: 100,
    crop : 'fill',
    gravity : 'face',
    format : 'webp' 
  }
];


exports.balls = function(req, res) {
    var deferredArray = [];
    

  if (req.files.displayImage.length) {
    for (var i = 0; i < req.files.displayImage.length; i++) {
      handleUpload(req.files.displayImage[i]).then(function() {
        console.log(i + ' job done.');
      });

    };
  } else {
    handleUpload(req.files.displayImage).then(function(response) {
      console.log(response);
      console.log('DONEEEEEE!!!!!!!!');
      db_images.insert(response[0].value);
      res.redirect('/')
      res.end();
    })
  }
  

  function handleUpload(file) {
    var jobDeferred = Q.defer();
    fs.readFile(file.path, function (err, data) {
      var newPath = __parentDir + "/tmp/" + file.originalFilename;
     
      console.time('writing...');
      fs.writeFile(newPath, data, function (err) {
        console.timeEnd('writing...');
        var id = crypto.randomBytes(4).toString('hex'); 

          
          var args = {
            id : id,
            jobDeferred : jobDeferred,
            filename : file.originalFilename,
            file : file,
            sizes : sizes
          }
          
          resizeAndPush(args);

      });//writeFile
    });//readFile
    return jobDeferred.promise
  }//handleUpoad

}//balls

function resizeAndPush(args) {
    console.log(args.sizes);
    var resizeDeferredArray = [];
    console.time('cloudinary api call');
    var recordObject = {
      id : args.id
    };

    var upToCloud = cloudinary.uploader.upload(
      args.file.path,
      function(result) { 
        console.log('result------------------');
        console.log(result);
        console.timeEnd('cloudinary api call');
        for (var i = 0; i < result.eager.length; i++) {

          var resizeDeferred = Q.defer();
          resizeDeferredArray.push(resizeDeferred.promise);
          result.eager[i]
          var tmpfile = fs.createWriteStream(__parentDir + '/tmp/' + result.eager[i].width + args.file.originalFilename);
          // console.log('writing');
          // console.log(tmpfile);
          var sizeString = '';
          if (args.sizes[i].width && args.sizes[i].height) sizeString = '' + args.sizes[i].width + 'x' + args.sizes[i].height;
          else sizeString = args.sizes[i].width ? args.sizes[i].width : args.sizes[i].height;
          getFileFromCloudinAry({
            url : result.eager[i].url,
            tmpfile : tmpfile,
            resizeDeferred : resizeDeferred,
            id : args.id,
            size : sizeString,
            name : args.file.originalFilename,
            number : i,
            recordObject : recordObject
          })
          Q.allSettled(resizeDeferredArray).then(function(responseArray) {
            //console.log(responseArray);
            args.jobDeferred.resolve(responseArray);
            res.end();
            //db_images.insert(record);
          });

        };
      }, 
      {
        public_id: 'sample_id', 
        crop: 'limit',
        width: 2000,
        height: 2000,
        eager: args.sizes,                                     
        tags: ['special', 'for_homepage']
      }      
    );
  
}

function getFileFromCloudinAry(args) {
  console.time(args.number + 'http get from cloudinary');
  var request = http.get(args.url, function(response) {
    response.pipe(args.tmpfile);
    args.tmpfile.on('finish', function() {
      console.timeEnd(args.number + 'http get from cloudinary');
      args.tmpfile.close();
      //console.log(args.tmpfile);
      var amazonPath = '/tmp/' + args.id + '_' + args.size + '_' + args.name
      pushToS3({
        tmpfile : args.tmpfile,
        amazonPath : amazonPath,
        resizeDeferred : args.resizeDeferred,
        id : args.id,
        size : args.size,
        number : args.number,
        recordObject : args.recordObject
      });              
    })
  });
}

function pushToS3(args) {
  var client = knox.createClient({
    key : AWSKEY,
    secret : AWSSECRET,
    bucket : BUCKET

  });
  console.time(args.number + 'pushing to S3');
  var putting = client.putFile(
    args.tmpfile.path, 
    args.amazonPath,
    { 'x-amz-acl': 'public-read' }, 
    function(err, s3res) {
      console.timeEnd(args.number + 'pushing to S3');
      // console.log('err:');
      // console.log(err);
      if (!s3res) return args.resizeDeferred.reject(err);
      else s3res.resume(); 
      args.recordObject['s_' + args.size] = CLOUDFRONT_PATH + args.amazonPath;
      args.resizeDeferred.resolve(args.recordObject);
      console.log(args.recordObject);
  });

  putting.on('progress', function(written) {
    console.log(written);
    
  })
  putting.on('error', function(error) {
    console.log(error);

  })
}