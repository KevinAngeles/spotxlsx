const express = require('express');
const router = express.Router();

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/login');
}

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
	res.render('index', { title: 'Playlist to XLS', user: req.user });
});

module.exports = router;
