const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/user.js');
const moment = require('moment');

// Require excel library
const xl = require('excel4node');

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
	let errorStatus = 500;
	// Error
	if (error.response) {
		// The request was made and the server responded with a status code
		// that falls out of the range of 2xx
		console.log(error.response.data);
		console.log(error.response.status);
		console.log(error.response.headers);
		errorStatus = error.response.status;
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
		return res.status(errorStatus).send(msg || "There was an error.");
	}
}

/**
 * Summary. Function that extract an Spotify ID from url.
 *
 * Description. The function reads a url and detects the initial part of the Spotify ID
 * as well as the final part of the Spotify ID. Then, it slices the url
 * to obtain the Spotify ID.
 *
 * @param {string}  playlist_uri       URI containing the Spotify Id.
 * 
 * @return {string}
 */
const getIdFromUrl = (playlist_uri) => {
	let init_pos = playlist_uri.indexOf("playlists/") + 10;
	let end_pos = playlist_uri.indexOf("/tracks");
	return playlist_uri.slice(init_pos, end_pos);
}

/**
 * Summary. Function that returns a promise with the name of the file based on the Spotify display name or ID.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token
 * to obtain information about the user. If a display list is not undefined, it becomes the file name.
 * Otherwise, the Spotify ID is used as a file name. It returns a promise with the file name
 *
 * @param {string}    access_token       Access token required for Spotify request.
 * @param {string}    userid             Spotify Id.
 *
 * @return {Promise<string>} 
 */
const getFileName = (access_token, userid) => {
	return new Promise( (resolve, reject) => {
		// Get display name of user
		axios.get(`https://api.spotify.com/v1/users/${userid}`, { 
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${access_token}`
			}
		}).then( response => {
			// Get the display_name
			let display_name = response["data"]["display_name"];
			let display_name_UTF8 = JSON.parse( JSON.stringify( display_name ) );
			// Use the userid as xlsx_file_name
			let xlsx_file_name = userid;
			// However, if display_name is a non-empty string, use the display_name as xlsx_file_name
			if (typeof display_name_UTF8 === "string" && display_name_UTF8.trim().length > 0) {
				// Replace spaces with underscores ("_")
				xlsx_file_name = display_name_UTF8.replace(/\s+/g,"_");
			}
			xlsx_file_name += ".xlsx";			
			resolve(xlsx_file_name);
		}).catch( error => {
			reject(error);
		});
	});
}

/**
 * Summary. Function that returns a promise with an array of playlists from an spotify account.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token
 * to obtain the playlists of a spotify account. It returns a promise with an array of playlists.
 *
 * @param {string}    access_token       Access token required for Spotify request.
 * @param {string}    userid             Spotify Id.
 *
 * @return {Promise<[Object]>}
 */
const getListOfPlaylists = (access_token, userid) => {
	return new Promise( (resolve, reject) => {
		axios.get(`https://api.spotify.com/v1/users/${userid}/playlists`, { 
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${access_token}`
			}
		}).then( response => {
			let playlists = response["data"]["items"];
			resolve(playlists);
		}).catch( error => {
			reject(error);
		});
	});
}

/**
 * Summary. Function that returns a promise with an array of requests and name for each playlist from an spotify account.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token
 * to each playlist of a spotify account. It returns a promise with an array of promises of each playlist.
 *
 * @param {string}    access_token       Access token required for Spotify request.
 * @param {[Object]}  playlists          Array of objects containing data of each playlist.
 * @param {string}    userid             Spotify Id.
 *
 * @return {Promise<[Promise<Object>]>}
 */
const getRequestsPromisesAndNamesForEachPlaylist = (access_token, playlists, userid) => {
	return new Promise( (resolve, reject) => {
		// Save promises here
		let arrPlaylistPromises = [];
		let playlistNames = {};
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
					arrPlaylistPromises.push(axios.get(offseturl, config));
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
			}
		}
		const playlistsAndNames= {
			arrPlaylistPromises: arrPlaylistPromises,
			playlistNames: playlistNames
		}
		resolve(playlistsAndNames);
	});
}

/**
 * Summary. Function that writes an excel file with the playlists from an Spotify account.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token
 * to obtain a list of the playlists. Next, for each playlist, it makes another request to
 * obtain the tracks. Then, it makes another request to get the display name. If the display 
 * name exists, it is used as the file name. Otherwise, the Spotify ID is used. Finally, it 
 * writes an excel file with the playlists.
 *
 * @param {string}    access_token       Access token required for Spotify request.
 * @param {string}    userid             Spotify Id.
 * @param {Workbook}  wb                 ('excel4node').Workbook() Object.
 * @param {Object}    res                Response Object.
 * 
 */
const getPlaylistsAndExport = (access_token, userid, wb, res) => {
	getListOfPlaylists(access_token, userid)
		.then( playlists => {
			getRequestsPromisesAndNamesForEachPlaylist(access_token, playlists, userid)
				.then( playlistPromisesAndNames => {
					const arrPlaylistPromises = playlistPromisesAndNames.arrPlaylistPromises;
					const playlistNames = playlistPromisesAndNames.playlistNames;
					let userplaylists = [];
					axios.all(arrPlaylistPromises)
						.then( axios.spread( (...results) => {
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
						})).then( () => {
							writeSheets(userplaylists, playlistNames, wb);
						
							getFileName(access_token, userid)
								.then( xlsx_file_name => {
									wb.write(xlsx_file_name, res);
								}).catch( error => {
									handleError(error, res, "Error: Id Not Found");
								});
						}).catch( error => {
							handleError(error, res, "Error: there was a problem with request");
						});
				}).catch( error => {
					handleError(error, res);
				});
		}).catch( error => {
			handleError(error, res);
		});
}

/**
 * Summary. Function that writes an excel file from a list of playlists.
 *
 * Description. This function uses a list of playlists to write each playlist in a page. 
 *
 * @param {[Object]}   userplaylists        Array of Playlists.
 * @param {[Object]}   playlistNames        Array of objects containing Playlist IDs and Names.
 * @param {Workbook}   wb                   ('excel4node').Workbook() Object.
 * 
 */
const writeSheets = (userplaylists, playlistNames, wb) => {
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

	// If there is at least one playlist
	if (userplaylists.length > 0) {
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
				tracks.forEach( track => {
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
	// If there are no playlists
	else {
		let ws = wb.addWorksheet("No Playlists");
		ws.cell(1,1,1,4,true).string("This account has not playlists").style(headerStyle);
	}
}


// POST /playlist
router.post('/', (req, res, next) => {
	// Spotify user Id TO SEARCH
	let userid = req.body.userid;
	let wb = new xl.Workbook();
	
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
						getPlaylistsAndExport(access_token, userid, wb, res);
					});
				}).catch( error => {
					handleError(error, res, "Error while processing the tokens.");
				});
			}
		}
		else {
			handleError(error, res, "Error: no access token");
		}
	});
});

module.exports = router;
