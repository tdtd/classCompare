var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require('path');
var port = process.env.PORT || 3500;
var scraper = require('./lib/scraper.js');

server.listen(port, function(){
  console.log("Listening on "+port);
});

app.get('/classInfo', function(req,res) {
  return res.json(scraper.classInfo).status(200);
});

app.use(express.static(path.resolve(__dirname, 'client')));

app.get('/*', function(req, res){
  res.json({err: 'Page Not Found'}).status(404);
});