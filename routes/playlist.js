const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/user.js');
const moment = require('moment');

// Require library
let xl = require('excel4node');

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/login');
}

function getIdFromUrl(playlist_uri) {
	let init_pos = playlist_uri.indexOf("playlists/") + 10;
	let end_pos = playlist_uri.indexOf("/tracks");
	return playlist_uri.slice(init_pos, end_pos);
}

function getPlaylistsAndExport(access_token, userid, wb, res) {
	//Save promises here
	let promises = [];
	let playlistNames = {};
	axios.get(`https://api.spotify.com/v1/users/${userid}/playlists`, { 
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${access_token}`
		}
	}).then(function(response) {
		let playlists = response["data"]["items"];

		for(let i=0; i<playlists.length; i++) {
			let playlistid = playlists[i]["id"];
			playlistNames[playlistid] = playlists[i]["name"];
			if (playlists[i]["owner"]["id"] === userid)
			{
				playlists[playlistid] = playlists[i]["name"];
				let axiosurl = `https://api.spotify.com/v1/users/${userid}/playlists/${playlistid}/tracks`;
				let config = {
					headers: {
		 				'Accept': 'application/json',
		 				'Content-Type': 'application/json',
		 				'Authorization': `Bearer ${access_token}`
		 			}
			 	};
			 	// If a playlist has offsets, create multiple requests for that playlist 
				let offset = 0;
			 	let leftTracks = playlists[i]["tracks"]["total"];
				let offseturl = axiosurl + `?offset=${offset}`;

				while (leftTracks > 0) {
					promises.push(axios.get(offseturl, config));
					if (leftTracks > 100)
					{
						leftTracks -= 100;
						offset += 100;
					}
					else {
						leftTracks = 0;
						offset += leftTracks;
					}
					offseturl = axiosurl + `?offset=${offset}`;
				}
				//promises.push(axios.get(axiosurl, config));
			}
		}

		let userplaylists = [];
		axios.all(promises)
			.then(axios.spread((...results) => {
				// Merge playlists with same id
				let tmp_playlist_id = "";
				for (let i = 0; i < results.length; i++) {
					let current_playlist_id = getIdFromUrl(results[i]["data"]["href"]); 
					if (userplaylists.length === 0) {
						// First push to userplaylists
						userplaylists.push(results[i]["data"]);
						tmp_playlist_id = current_playlist_id;
					}
					else {
						if (tmp_playlist_id === current_playlist_id) {
							// Add to previous position
							userplaylists[userplaylists.length - 1]["items"].push(...results[i]["data"]["items"]);
						}
						else {
							// Update new uri
							tmp_playlist_id = current_playlist_id;
							userplaylists.push(results[i]["data"]);
						}
					}
				}
				//results.map(r => userplaylists.push(r.data));
		})).then( function (e) {
			writeSheets(userplaylists, playlistNames, wb)
			wb.write(`${userid}.xlsx`, res);
		}).catch(function (error) {
			console.log(error);
		});
	}).catch(function (error) {
		console.log(error);
	});
}

function writeSheets(userplaylists, playlistNames, wb) {
	// Create a reusable style
	let headerStyle = wb.createStyle({
	    font: {
	    	bold: true,
	        color: '#000000',
	        size: 18
	    }
	});

	let normalStyle = wb.createStyle({
	    font: {
	        color: '#000000',
	        size: 12
	    }
	});

	let linkStyle = wb.createStyle({
	    font: {
	        size: 12
	    }
	});

	for(let j=0; j<userplaylists.length; j++) {
		let tracks = userplaylists[j]["items"];
		let playlistId = getIdFromUrl(userplaylists[j]["href"]);
		let playlistName = playlistNames[playlistId];

		if( tracks.length > 0 )
		{
			// Add Worksheets to the workbook
			let ws = wb.addWorksheet(playlistName);

			// Set value of cells A1:A4 to playlistName styled with paramaters of style
			ws.cell(1,1,1,4,true).string(playlistName).style(headerStyle);
			 
			// Set style to headers
			ws.cell(2,1).string('Artist').style(headerStyle);
			ws.cell(2,2).string('Track').style(headerStyle);
			ws.cell(2,3).string('Spotify URL').style(headerStyle);
			ws.cell(2,4).string('Added at').style(headerStyle);
			 
			let trackRow = 3;
			// Set value of songs to cells and style them with paramaters of style
			tracks.forEach(function(track) {
				if( track["is_local"] === false )
				{
					let song = track["track"]["name"];
					let artist = track["track"]["artists"][0]["name"];
					let url = track["track"]["external_urls"]["spotify"];
					let addedAt = track["added_at"];
					ws.cell(trackRow,1).string(song).style(normalStyle);
					ws.cell(trackRow,2).string(artist).style(normalStyle);
					ws.cell(trackRow,3).link(url).style(linkStyle);
					ws.cell(trackRow,4).string(addedAt).style(normalStyle);
					trackRow++;
				}
			});
		}
		else
		{
			console.log("No tracks in this list.");
		}
	}
}
/* GET home page. */
router.post('/', ensureAuthenticated, function(req, res, next) {
	let userid = req.body.userid;
	let wb = new xl.Workbook();
	
	User.findOne({spotifyId: req.user.id}, function(err,usr) {
		if (err) throw err;
		if (usr) {
			// Subtract one minute from the expiration_date in order to have more time to renew the access_token
			let expiration_moment = moment(usr.expiration_date).subtract(1,'minutes');
			let current_moment = moment();
			let access_token = usr.accessToken;
			let refresh_token = usr.refreshToken;
			if(current_moment <= expiration_moment) {
				// access_token still is valid
				getPlaylistsAndExport(access_token, userid, wb, res);
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
				}).then(function(response) {
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
					User.update({spotifyId: req.user.id}, spotifyUser, function(er, usr) {
						if (er) throw er;
						getPlaylistsAndExport(access_token, userid, wb, res);
					});
				}).catch(function (error) {
					console.log(error);
				});
			}
		}
		else {
			console.log("Error: no access token");
		}
	});
});

module.exports = router;
