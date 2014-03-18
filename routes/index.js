var express = require('express'),
  http = require('http'),
  fs = require('fs'),
  path = require('path'),
  __parentDir = path.dirname(process.mainModule.filename),
  gm = require('gm'),
  imageMagick = gm.subClass({ imageMagick: true });

exports.upload = function(req, res) {

  res.render('upload');
  var object = { foo: "bar" };
  var string = JSON.stringify(object);
  var s3req = client.put('/test/obj.json', {
      'Content-Length': string.length
    , 'Content-Type': 'application/json'
  });
  s3req.on('response', function(res){
    if (200 == res.statusCode) {
      console.log('saved to %s', s3req.url);
    }
  });
  
  s3req.end(string);
  console.log(s3req);
}



exports.balls = function(req, res) {
  console.log('hi2');
  //console.log(req.files);
//console.log(res);
// fs.readFile(req.files.displayImage.path, function (err, data) {
//   // ...
//   var newPath = __parentDir + "/tmp/" + req.files.displayImage.originalFilename;

//   fs.writeFile(newPath, data, function (err) {
//     var thumbPath = __parentDir + '/tmp/100x100' + req.files.displayImage.originalFilename;

//     imageMagick(newPath)
//       .resize(100, 100)
//       .write(thumbPath, function(err) {
//         // var putting = client.putFile(thumbPath, '/tester.jpg', function(err, s3res) {
//         //   console.log(err);
//         //   console.log(s3res);
//         //   s3res.resume();  
//         //   res.redirect('upload')  ;
//         // });
//         upload = new MultiPartUpload({
//           client: client,
//           objectName : 'teZT.jpg',
//           file : thumbPath
//         }, function(err, body) {

//         });
//       });
    
//   });
// });
}