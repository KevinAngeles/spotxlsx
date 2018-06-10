const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/user.js');
const moment = require('moment');
const passport = require('passport');
const helper = require('../modules/helper.js');
const handleError = helper.handleError;
const verifyTokenAndGetAccessToken = helper.verifyTokenAndGetAccessToken;

/**
 * Summary. Function that validates if a Spotify ID exists.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token.
 * If the ID exists, a json with status 200 is returned. Otherwise, a json with a status 400
 * is returned indicating the error.
 *
 * @param {String}  acces_token        Access token required for Spotify request.
 * @param {String}  user_id            Spotify Id to validate.
 * @param {Object}  res                Response Object.
 * 
 * @return {json} res.json
 */
const ensureSpotifyUserExists = (access_token, user_id, res) => {
	axios.get(`https://api.spotify.com/v1/users/${user_id}`, { 
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${access_token}`
		}
	}).then( response => {
		if(response.data.id !== 'undefined') {
			return res.status(200).json({ status: 200, data: "Spotify Id Found" });
		}
		else {
			return res.status(404).json({ status: 404, data: "Spotify Id Not Found" });
		}
	}).catch( error => {
		handleError(error, res, "Spotify Id Not Found");
	});
};

// POST /auth
router.post('/', (req, res, next) => {
	// Spotify user Id TO SEARCH
	const user_id = req.body.userid;
	// Spotify id of the user CURRENTLY LOGGED into the application
	const spotify_id = req.user.id;
	verifyTokenAndGetAccessToken(spotify_id)
		.then( access_token => {
			ensureSpotifyUserExists(access_token, user_id, res);
		}).catch( error => {
			handleError(error);
		});
});

// GET /login
router.get('/login', (req, res, next) => {
	res.render('login', { title: 'LOGIN', user: req.user });
});

// GET /logout
router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

const spotify_scope = ['user-read-email', 'user-read-private', 'playlist-read-private', 'playlist-read-collaborative'];

// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
//   The permission dialog won't be displayed if the user has already given permission before to this application
router.get('/spotify', 
	passport.authenticate('spotify', {scope: spotify_scope, showDialog: false}),
	(req, res) => {
		// The request will be redirected to spotify for authentication, so this
		// function will not be called.
	}
);

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/spotify/callback',
	passport.authenticate('spotify', { failureRedirect: '/auth/login' }),
	(req, res) => {
		res.redirect('/');
	}
);

module.exports = router;
