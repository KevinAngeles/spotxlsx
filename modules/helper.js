const axios = require('axios');
const User = require('../models/user.js');
const moment = require('moment');

/**
 * Summary. Function that handle errors.
 *
 * Description. The function detects if it is a http error, request error
 * or other type of error. Then, it logs the error. Finally, if a response object was included
 * in the parameter, it responds with a status code and an optional custom message.
 * 
 *
 * @param {Object}  error     Error object.
 * @param {Object}  res       Response object.
 * @param {string}  msg       Custom error message.
 * 
 * @return {Response}
 */
const handleError = (error, res, msg) => {
	let error_status = 500;
	// Error
	if (error.response) {
		// The request was made and the server responded with a status code
		// that falls out of the range of 2xx
		console.log(error.response.data);
		console.log(error.response.status);
		console.log(error.response.headers);
		error_status = error.response.status;
	} else if (error.request) {
		// The request was made but no response was received
		// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
		// http.ClientRequest in node.js
		console.log(error.request);
	} else {
		// Something happened in setting up the request that triggered an Error
		console.log('Error', error.message);
	}

	if (res) {
		return res.status(error_status).json({ status: error_status, data: msg || "There was an error." });
	}
};

/**
 * Summary. Function that refresh access_token if required.
 *
 * Description. This function detects if the access token is still valid. It checks in the database
 * if the access_token has not expired and if it detects that the access_token needs to be refreshed, 
 * it makes a request to spotify using the saved refresh_token in order to get a new access_token.
 * This function returns a promise containing the access_token.
 *
 * @param {string}  spotify_id       ID of the user that is currently logged into the application.
 * 
 * @return {Promise<string>} access_token
 */
const verifyTokenAndGetAccessToken = (spotify_id) => {
	return new Promise( (resolve, reject) => {
		// Search in the database the access_token of the user CURRENTLY LOGGED into the application
		User.findOne({spotifyId: spotify_id}, (err, usr) => {
			if (err) throw err;
			if (usr) {
				// Subtract one minute from the expiration_date in order to have more time to renew the access_token
				let expiration_moment = moment(usr.expiration_date).subtract(1,'minutes');
				let current_moment = moment();
				let access_token = usr.accessToken;
				let refresh_token = usr.refreshToken;
				if(current_moment <= expiration_moment) {
					// access_token still is valid
					resolve(access_token);
				}
				else {
					// access_token must be renewed
					const app_key = process.env.APP_KEY;
					const app_secret = process.env.APP_SECRET;
					const authorization_code = "Basic " + (new Buffer(app_key + ':' + app_secret).toString('base64'));
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
						let spotify_user = {
							accessToken: access_token,
							expiration_date: moment().add(response.data.expires_in, 'seconds')
						};
						// Check if a new refresh_token was provided
						if (response.data.hasOwnProperty("refresh_token"))
							spotify_user['refreshToken'] = response.data.refresh_token;
						// Update token data in the database
						User.update({spotifyId: spotify_id}, spotify_user, (er, usr) => {
							if (er) throw er;
							resolve(access_token);
						});
					}).catch( error => {
						console.log("Error: problem with the token.");
						reject(error);
					});
				}
			}
			else {
				console.log("Error: no access_token.");
				reject(error);
			}
		});
	});
};

module.exports = {
	handleError: handleError,
	verifyTokenAndGetAccessToken: verifyTokenAndGetAccessToken,
};