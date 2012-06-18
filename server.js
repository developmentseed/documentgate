var url     = require('url'),
    http    = require('http'),
    https   = require('https'),
    fs      = require('fs'),
    app     = require('express').createServer(),
    request = require('superagent'),
    qs      = require('querystring'),
    queue   = require('queue-async')


function getDocuments(cb) {
  request
  .get('http://www.documentcloud.org/api/search.json')
  .send({ q: 'obama' })
  .set('Accept', 'application/json')
  .end(function(res) {
    
    var documents = res.body.documents;

    function getDocument(doc, cb) {
      request
      .get('https://www.documentcloud.org/api/documents/'+doc.id+'.json')
      .set('Accept', 'application/json')
      .end(function(res) { doc.data = res.body; });
    }
    // Fetching details
    var q = queue(1);
    documents.forEach(function(doc) { q.defer(getDocument, doc); });
    q.await(function(err, results) { console.log("all done!"); cb(null, documents); });
  });
}

// Load config defaults from JSON file.
// Environment variables override defaults.
function loadConfig() {
  var config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));
  for (var i in config) {
    config[i] = process.env[i.toUpperCase()] || config[i];
  }
  console.log('Configuration');
  console.log(config);
  return config;
}

var config = loadConfig();

// Convenience for allowing CORS on routes - GET only
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS'); 
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/documents', function(req, res) {
  res.contentType('application/json');
  getDocuments(function(err, documents) {
    res.send(JSON.stringify(documents, null, '  '));
  });
});

var port = process.env.PORT || config.server_port || 5555;
console.log(config.server_port);

app.listen(port, null, function (err) {
  console.log('DocumentGate, at your service: http://localhost:' + port);
});