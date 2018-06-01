const express = require('express');
const router = express.Router();

// GET /
router.get('/', (req, res, next) => {
	res.render('index', { title: 'Playlist to XLS', userid: req.user.id });
});

module.exports = router;
