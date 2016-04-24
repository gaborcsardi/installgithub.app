
var express = require('express');
var router = express.Router();
var fs = require('fs');

// ---------------------------------------------------------------------
// Home page

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

// ---------------------------------------------------------------------
// This is the old installer, that can be called via
// source("https://install-github.me/user/repo")

var re_user = '[-_\\.a-zA-Z0-9]+';
var re_repo = '[-_\\.a-zA-Z0-9]+';

var re = '^/(' + re_user + ')/(' + re_repo + ')$';

router.get(new RegExp(re), function(req, res) {
    var user = req.params[0];
    var repo = req.params[1];
    fs.readFile('./install-github.R', function(err, data) {
	if (err) throw(err)
	res .set('Content-Type', 'text/plain')
	    .send('(' + data + ')' + '("' + user + '/' + repo + '")')
	    .end();
    });
});

// ---------------------------------------------------------------------
// This is the Virtual CRAN
//
// When installing a package in general, install.packages() hits
// these URLs:
// https://cran.rstudio.com/src/contrib/PACKAGES.gz
// https://cran.rstudio.com/bin/macosx/mavericks/contrib/3.2/PACKAGES.gz
// https://cran.rstudio.com/bin/macosx/mavericks/contrib/3.2/igraph_1.0.1.tgz
// The last two are for binary packages, and are platform dependent.
//
// When installing a source package, these are hit:
// https://cran.rstudio.com/src/contrib/PACKAGES.gz
// https://cran.rstudio.com/src/contrib/igraph_1.0.1.tar.gz
//
// So we need to emulate two kinds of requests. One is the PACKAGES.gz
// request. This needs to go on GitHub, get the DESCRPTION file, parse
// it, discover all dependencies of the package recursively (which
// potentially means going on GitHub again), and then creating a
// PACKAGES.gz file for these packages.

var re1 = '^/(' + re_user + ')/(' + re_repo +
    ')/src/contrib/PACKAGES\\.gz$';

router.get(new RegExp(re1), function(req, res) {
  var user = req.params[0];
  var repo = req.params[1];

  // TODO

  res.send(user + '/' + repo + '/PACKAGES.gz')
    .end();
});

// The other kind of request is the actual package download.
// This must be currently a download from GitHub.

var re_pkg = '[\\.a-zA-Z0-9]+';
var re_ver = '[0-9]+[-\\.][0-9]+([-\\.][0-9]+)*';

var re2 = '^/(' + re_user + ')/(' + re_repo + ')/src/contrib/(' +
    re_pkg + ')_(' + re_ver + ')\\.tar\\.gz$';

router.get(new RegExp(re2), function(req, res) {
  var user = req.params[0];
  var repo = req.params[1];
  var pkg  = req.params[2];
  var ver  = req.params[3];

  // TODO

  res.send(user + '/' + repo + '/' + pkg + '/' + ver)
    .end();
});

module.exports = router;
