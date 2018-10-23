const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/user.js');
const moment = require('moment');
const logger = require('../logger');

// Require excel library
const xl = require('excel4node');

const helper = require('../modules/helper.js');
const handleError = helper.handleError;
const verifyTokenAndGetAccessToken = helper.verifyTokenAndGetAccessToken;

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
	const init_pos = playlist_uri.indexOf("playlists/") + 10;
	const end_pos = playlist_uri.indexOf("/tracks");
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
 * @param {string}    user_id            Spotify Id.
 *
 * @return {Promise<string>} 
 */
const getFileName = (access_token, user_id) => {
	return new Promise( (resolve, reject) => {
		// Get display name of user
		axios.get(`https://api.spotify.com/v1/users/${user_id}`, { 
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${access_token}`
			}
		}).then( response => {
			// Get the display_name
			const display_name = response["data"]["display_name"];
			const display_name_UTF8 = JSON.parse( JSON.stringify( display_name ) );
			// Use the user_id as xlsx_file_name
			let xlsx_file_name = user_id;
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
 * @param {string}    user_id            Spotify Id.
 *
 * @return {Promise<[Object]>}
 */
const getListOfPlaylists = (access_token, user_id) => {
	return new Promise( (resolve, reject) => {
		axios.get(`https://api.spotify.com/v1/users/${user_id}/playlists`, { 
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${access_token}`
			}
		}).then( response => {
			const playlists = response["data"]["items"];
			resolve(playlists);
		}).catch( error => {
			reject(error);
		});
	});
};

/**
 * Summary. Function that returns a promise with an array of requests and name for each playlist from an spotify account.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token
 * to each playlist of a spotify account. It returns a promise with an array of promises of each playlist.
 *
 * @param {string}    access_token       Access token required for Spotify request.
 * @param {[Object]}  playlists          Array of objects containing data of each playlist.
 * @param {string}    user_id            Spotify Id.
 *
 * @return {Promise<Object[]>}     Promise<Object[{Promise[playlist],{playlistNames}}]>
 */
const getRequestsPromisesAndNamesForEachPlaylist = (access_token, playlists, user_id) => {
	return new Promise( (resolve, reject) => {
		// Save promises here
		let arr_playlist_promises = [];
		let playlist_names = {};
		for(let i=0; i<playlists.length; i++) {
			let playlist_id = playlists[i]["id"];
			playlist_names[playlist_id] = playlists[i]["name"];
			if (playlists[i]["owner"]["id"] === user_id)
			{
				playlists[playlist_id] = playlists[i]["name"];
				let axios_url = `https://api.spotify.com/v1/users/${user_id}/playlists/${playlist_id}/tracks`;
				let config = {
					headers: {
		 				'Accept': 'application/json',
		 				'Content-Type': 'application/json',
		 				'Authorization': `Bearer ${access_token}`
		 			}
			 	};
			 	// If a playlist has offsets, create multiple requests for that playlist 
				let offset = 0;
			 	let left_tracks = playlists[i]["tracks"]["total"];
				let offset_url = axios_url + `?offset=${offset}`;

				while (left_tracks > 0) {
					arr_playlist_promises.push(axios.get(offset_url, config));
					if (left_tracks > 100)
					{
						left_tracks -= 100;
						offset += 100;
					}
					else {
						left_tracks = 0;
						offset += left_tracks;
					}
					offset_url = axios_url + `?offset=${offset}`;
				}
			}
		}
		const playlists_and_names = {
			arrPlaylistPromises: arr_playlist_promises,
			playlistNames: playlist_names
		}
		resolve(playlists_and_names);
	});
};

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
 * @param {string}    user_id            Spotify Id.
 * @param {Workbook}  wb                 ('excel4node').Workbook() Object.
 * @param {Object}    res                Response Object.
 * 
 */
const getPlaylistsAndExport = (access_token, user_id, wb, res) => {
	getListOfPlaylists(access_token, user_id)
		.then( playlists => {
			getRequestsPromisesAndNamesForEachPlaylist(access_token, playlists, user_id)
				.then( playlistPromisesAndNames => {
					const arr_playlist_promises = playlistPromisesAndNames.arrPlaylistPromises;
					const playlist_names = playlistPromisesAndNames.playlistNames;
					let user_playlists = [];
					axios.all(arr_playlist_promises)
						.then( axios.spread( (...results) => {
							// Merge playlists with same id
							let tmp_playlist_id = "";
							for (let i = 0; i < results.length; i++) {
								let current_playlist_id = getIdFromUrl(results[i]["data"]["href"]); 
								if (user_playlists.length === 0) {
									// First push to user_playlists
									user_playlists.push(results[i]["data"]);
									tmp_playlist_id = current_playlist_id;
								}
								else {
									if (tmp_playlist_id === current_playlist_id) {
										// Add to previous position
										user_playlists[user_playlists.length - 1]["items"].push(...results[i]["data"]["items"]);
									}
									else {
										// Update new uri
										tmp_playlist_id = current_playlist_id;
										user_playlists.push(results[i]["data"]);
									}
								}
							}
						})).then( () => {
							writeSheets(user_playlists, playlist_names, wb);
						
							getFileName(access_token, user_id)
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
};

/**
 * Summary. Function that writes an excel file from a list of playlists.
 *
 * Description. This function uses a list of playlists to write each playlist in a page. 
 *
 * @param {[Object]}   user_playlists       Array of Playlists.
 * @param {[Object]}   playlist_names       Array of objects containing Playlist IDs and Names.
 * @param {Workbook}   wb                   ('excel4node').Workbook() Object.
 * 
 */
const writeSheets = (user_playlists, playlist_names, wb) => {
	// Create a reusable style
	let header_style = wb.createStyle({
	    font: {
	    	bold: true,
	        color: '#000000',
	        size: 18
	    }
	});

	let normal_style = wb.createStyle({
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
	if (user_playlists.length > 0) {
		for(let j=0; j<user_playlists.length; j++) {
			const tracks = user_playlists[j]["items"];
			const playlist_id = getIdFromUrl(user_playlists[j]["href"]);
			const playlist_name = playlist_names[playlist_id];

			if( tracks.length > 0 )
			{
				// Add Worksheets to the workbook
				let ws = wb.addWorksheet(playlist_name);

				// Set value of cells A1:A4 to playlist_name styled with paramaters of style
				ws.cell(1,1,1,4,true).string(playlist_name).style(header_style);
				 
				// Set style to headers
				ws.cell(2,1).string('Artist').style(header_style);
				ws.cell(2,2).string('Track').style(header_style);
				ws.cell(2,3).string('Spotify URL').style(header_style);
				ws.cell(2,4).string('Added at').style(header_style);
				 
				let track_row = 3;
				// Set value of songs to cells and style them with paramaters of style
				tracks.forEach( track => {
					if( track["is_local"] === false && track["track"])
					{
						logger.silly(track);
						const song = track["track"]["name"];
						const artist = track["track"]["artists"][0]["name"];
						const url = track["track"]["external_urls"]["spotify"];
						const added_at = track["added_at"];
						ws.cell(track_row,1).string(song).style(normal_style);
						ws.cell(track_row,2).string(artist).style(normal_style);
						ws.cell(track_row,3).link(url).style(linkStyle);
						ws.cell(track_row,4).string(added_at).style(normal_style);
						track_row++;
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
		ws.cell(1,1,1,4,true).string("This account has not playlists").style(header_style);
	}
};


// POST /playlist
router.post('/', (req, res, next) => {
	// Spotify user Id TO SEARCH
	const user_id = req.body.userid;
	const wb = new xl.Workbook();
	// Spotify id of the user CURRENTLY LOGGED into the application
	const spotify_id = req.user.id;
	verifyTokenAndGetAccessToken(spotify_id)
		.then( access_token => {
			getPlaylistsAndExport(access_token, user_id, wb, res);
		}).catch( error => {
			handleError(error);
		});
});

module.exports = router;
