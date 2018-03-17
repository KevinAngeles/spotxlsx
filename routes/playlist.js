const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/user.js');

// Require library
let xl = require('excel4node');

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/login');
}

/* GET home page. */
router.post('/', ensureAuthenticated, function(req, res, next) {
	let userid = req.body.userid;
	console.log(`The userid is: ${userid}`);
	let playlistNames = {};
	let wb = new xl.Workbook();
	
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
	User.findOne({spotifyId: userid}, function(err,usr) {
		if (err) throw err;
		if (usr) {
			let access_token = usr.accessToken;
			//Save promises here
			let promises = [];
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
						let params = {
							headers: {
				 				'Accept': 'application/json',
				 				'Content-Type': 'application/json',
				 				'Authorization': `Bearer ${access_token}`
				 			}
					 	};
						promises.push(axios.get(axiosurl, params));
					}
				}

				let userplaylists = [];
				axios.all(promises)
					.then(axios.spread((...results) => {
						results.map(r => userplaylists.push(r.data));
				})).then( function (e) {
					for(let j=0; j<userplaylists.length; j++) {
						let tracks = userplaylists[j]["items"];
						let playlist_uri = userplaylists[j]["href"];
						let init_pos = playlist_uri.indexOf("playlists/") + 10;
						let end_pos = playlist_uri.indexOf("/tracks");
						let playlistId = playlist_uri.slice(init_pos, end_pos);
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
					wb.write(`${userid}.xlsx`,res);
				}).catch(function (error) {
					console.log(error);
				});
				
			}).catch(function (error) {
				console.log(error);
			});
		}
		else {
			console.log("Error: no access token");
		}
	});
});

module.exports = router;
