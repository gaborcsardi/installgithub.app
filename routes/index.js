var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

var re = '/([-_\\.a-zA-Z0-9]+)/([-_\\.a-zA-Z0-9]+)';

router.get(new RegExp(re), function(req, res) {
    var user = req.params[0];
    var repo = req.params[1];
    fs.readFile('./install-github.R', function(err, data) {
	if (err) throw(err)
	res .set('Content-Type', 'text/plain')
	    .send('(' + data + ')' + '("' + user + '/' + repo + '")')
	    .end();
    })
})

module.exports = router;
