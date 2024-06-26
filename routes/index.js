import express from 'express';
var router = express.Router();
import fs from 'fs';

import got from 'got';
import ghGot from 'gh-got';
import rdesc from 'rdesc-parser';
import rhubnode from 'rhub-node';
const deps = rhubnode.dependency_types;
import urls from '../lib/urls.js';

// ---------------------------------------------------------------------
// Home page

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// ---------------------------------------------------------------------
// This is the old installer, that can be called via
// source("https://install-github.me/user/repo")

var re_user = '[-_\\.a-zA-Z0-9]+';
var re_repo = '[-_\\.a-zA-Z0-9@#]+';

var re = '^/(' + re_user + ')/(' + re_repo + ')$';

router.get(new RegExp(re), function (req, res) {
  var user = req.params[0];
  var repo = req.params[1];
  fs.readFile('./install-github.R', function (err, data) {
    if (err) throw (err)
    res.set('Content-Type', 'text/plain')
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
  ')/src/contrib/PACKAGES(?:\\.gz|)$';

router.get(new RegExp(re1), function (req, res) {
  var user = req.params[0];
  var repo = req.params[1];

  var url = urls.gh_pkg_description(user, repo);

  var stream = got.stream(url);
  var httperr = false;

  stream.on('error', function (error, body, response) {
    httperr = error;
  });

  rdesc(stream, function (err, data) {
    if (httperr || err) {
      return (error_out(res, 'Cannot parse DESCRIPTION: ' + httperr || err));
    }

    res.set('Content-Type', 'text/plain');

    var ans =
      'Package: ' + data.Package + '\n' +
      'Version: ' + data.Version + '\n';

    for (var deptype of deps) {
      if (data[deptype] !== undefined) {
        ans = ans + deptype + ': ';
        ans = ans + data[deptype].map(function (x) {
          if (x.version) {
            return x.package + ' (' + x.version + ')';
          } else {
            return x.package;
          }
        }).join(', ');
        ans = ans + '\n';
      }
    }

    ans = ans +
      'License: ' + data.License + '\n';

    var url2 = urls.gh_pkg_contents(user, repo);
    ghGot(url2)
      .then(function (list) {
        var names = list.body.map(function (x) { return x.name; });
        if (names.indexOf('src') > -1) {
          ans = ans + 'NeedsCompilation: yes\n';
        } else {
          ans = ans + 'NeedsCompilation: no\n';
        }
        res.send(ans);
      })
      .catch(function (error) {
        return (error_out(res, 'Cannot reach GitHub'));
      });

  });
});

// The other kind of request is the actual package download.
// This must be currently a download from GitHub.

var re_pkg = '[\\.a-zA-Z0-9]+';
var re_ver = '[0-9]+[-\\.][0-9]+([-\\.][0-9]+)*';

var re2 = '^/(' + re_user + ')/(' + re_repo + ')/src/contrib/(' +
  re_pkg + ')_(' + re_ver + ')\\.tar\\.gz$';

router.get(new RegExp(re2), function (req, res) {
  var user = req.params[0];
  var repo = req.params[1];
  var pkg = req.params[2];
  var ver = req.params[3];

  var url = urls.gh_tar_gz(user, repo);
  got.stream(url).on('response', function (response) {
    res.set('Content-Type', 'application/x-gzip');
    if (!!response.headers['content-length']) {
      res.set('Content-Length', +response.headers['content-length']);
    }
    this.pipe(res);
  });
});

// PACKAGES for binaries, we just return an empty file to
// avoid warnings

router.get(new RegExp('PACKAGES'), function (req, res) {

  res.set('Content-Type', 'text/plain')
    .send('');

});

function error_out(res, err) {
  res.status(404)
    .send('Error\n' + err);
}

export default router;
