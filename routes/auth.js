const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/user.js');
const moment = require('moment');
const passport = require('passport');

/**
 * Summary. Function that validates if a Spotify ID exists.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token.
 * If the ID exists, a json with status 200 is returned. Otherwise, a json with a status 400
 * is returned indicating the error.
 *
 * @param {String}  acces_token        Access token required for Spotify request.
 * @param {String}  userid             Spotify Id.
 * @param {Object}  res                Response Object.
 * 
 * @return {json} res.json
 */
function ensureSpotifyUserExists(access_token, userid, res) {
	axios.get(`https://api.spotify.com/v1/users/${userid}`, { 
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
		return res.status(error.response.status || 500).json({ status: (error.response.status || 500), data: "Spotify Id Not Found" });
	});
}

// POST /auth
router.post('/', (req, res, next) => {
	let userid = req.body.userid;
	// Search in the database the access_token of the user CURRENTLY LOGGED into the application
	User.findOne({spotifyId: req.user.id}, (err, usr) => {
		if (err) throw err;
		if (usr) {
			// Subtract one minute from the expiration_date in order to have more time to renew the access_token
			let expiration_moment = moment(usr.expiration_date).subtract(1,'minutes');
			let current_moment = moment();
			let access_token = usr.accessToken;
			let refresh_token = usr.refreshToken;
			if(current_moment <= expiration_moment) {
				// access_token still is valid
				ensureSpotifyUserExists(access_token, userid, res);
			}
			else {
				// access_token must be renewed
				const appKey = process.env.APP_KEY;
				const appSecret = process.env.APP_SECRET;
				const authorization_code = "Basic " + (new Buffer(appKey + ':' + appSecret).toString('base64'));
				// Request new access_token using refresh_token
				axios({
					method: 'POST',
					url: "https://accounts.spotify.com/api/token", 
					params: {
						grant_type: 'refresh_token',
						refresh_token: refresh_token
					},
					headers: {
						"Content-Type" : "application/x-www-form-urlencoded",
						'Authorization': authorization_code
					}
				}).then( response => {
					// Get the access token from the response
					access_token = response.data.access_token;
					let spotifyUser = {
						accessToken: access_token,
						expiration_date: moment().add(response.data.expires_in, 'seconds')
					};
					// Check if a new refresh_token was provided
					if (response.data.hasOwnProperty("refresh_token"))
						spotifyUser['refreshToken'] = response.data.refresh_token;
					// Update token data in the database
					User.update({spotifyId: req.user.id}, spotifyUser, (er, usr) => {
						if (er) throw er;
						ensureSpotifyUserExists(access_token, userid, res);
					});
				}).catch( error => {
					return res.status(error.response.status || 500).json({ status: (error.response.status || 500), error: 'Error related to the token.' });
				});
			}
		}
		else {
			console.log("Error: no access token");
		}
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

const spotifyScope = ['user-read-email', 'user-read-private', 'playlist-read-private', 'playlist-read-collaborative'];

// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
//   The permission dialog won't be displayed if the user has already given permission before to this application
router.get('/spotify', 
	passport.authenticate('spotify', {scope: spotifyScope, showDialog: false}),
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
