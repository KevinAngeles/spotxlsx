import type { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { TJsonError, TPlaylist, TPlaylists, TPlaylistTracks } from '@/types/types';
import { assertIsJsonError, getErrorMessage } from '@/utils/errorHandler';
import { auth } from '@/auth';
import { getMongoDb } from '@/lib/mongodb';
import { findAccountById } from '@/lib/db/account';
import AccountModel from '@/lib/models/AccountModel';
import { refreshSpotifyToken, createSpotifyUserExistsJSON, parseStringToUTF8, parseWorksheetName } from '@/utils/index';
import xl, { Workbook, Worksheet } from 'excel4node';

/**
 * Summary. Function that returns a promise with an array of playlists from an spotify account.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token
 * to obtain the playlists of a spotify account. It returns a promise with an array of playlists.
 *
 * @param {string}    access_token       Access token required for Spotify request.
 * @param {string}    user_id            Spotify Id.
 *
 * @return {Promise<[TPlaylists | TJsonError]>}
 */
const getListOfPlaylists = async (access_token: string, offset: number, user_id?: string): Promise<TPlaylists | TJsonError> => {
  const spotifyId = user_id ?? 'me';
  const queryParameters = new URLSearchParams({limit: '50', offset: `${offset}`});
  const getPlaylistsUrl = `https://api.spotify.com/v1/users/${spotifyId}/playlists?${queryParameters}`;
  try {
    const response = await fetch(getPlaylistsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      }
    });
    if(response.status === 401) {
      const errorJson = await response.json();
      return errorJson;
    }
    if(response.status !== 200) {
      return { error: { status: response.status, message: 'Error while fetching playlists'}};
    }
    const playlists: TPlaylists = await response.json();
    return playlists;
  } catch (error) {
    throw error;
  }
};

type TPlaylistUrlConfig = {
  offsetUrl: string,
  config: {
    headers: {
      'Accept': string;
      'Content-Type': string;
      'Authorization': string;
    }
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
const getIdFromUrl = (playlist_uri: string) => {
  const init_pos = playlist_uri.indexOf('playlists/') + 10;
  const end_pos = playlist_uri.indexOf('/tracks');
  return playlist_uri.slice(init_pos, end_pos);
};

/**
 * Summary. Function that returns a promise with an array of requests and name for each playlist from an spotify account.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token
 * to each playlist of a spotify account. It returns a promise with an array of promises of each playlist.
 *
 * @param {string}       access_token    Access token required for Spotify request.
 * @param {TPlaylist[]}  playlists       Array of objects containing data of each playlist.
 * @param {string}       user_id         Spotify Id.
 *
 * @return Promise on a object that contains an array promise responses and
 *  object where the key is the playlistId and the value is the playlistName
 */
const getRequestsPromisesAndNamesForEachPlaylist = async (access_token: string, playlists: TPlaylist[], user_id: string): Promise<{
  playlistsRequestPromises: Promise<Response>[],
  playlistNames: { [playlistId: string]: string }
}> => {
  let playlistURLConfig: TPlaylistUrlConfig[] = [];
  let playlistNames = {} as {[k: string]: string};
  for(let i=0; i < playlists.length; i++) {
    let playlist_id = playlists[i]['id'];
    playlistNames[playlist_id] = playlists[i]['name'];
    if (playlists[i]['owner']['id'] === user_id) {
      const spotifyApiBaseUrl = 'https://api.spotify.com/v1';
      const spotifyPlaylistParams = (user_id === '') ? `/playlists/${playlist_id}/tracks` : `/users/${user_id}/playlists/${playlist_id}/tracks`;
      const playlistUrl = `${spotifyApiBaseUrl}${spotifyPlaylistParams}`;
      let config = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
          }
      };
      // If a playlist has offsets, create multiple requests for that playlist 
      let offset = 0;
      let leftTracks = playlists[i]['tracks']['total'];
      let offsetUrl = `${playlistUrl}?offset=${offset}`;

      while (leftTracks > 0) {
        playlistURLConfig.push({ offsetUrl, config })
        if (leftTracks > 100) {
          leftTracks -= 100;
          offset += 100;
        } else {
          leftTracks = 0;
          offset += leftTracks;
        }
        offsetUrl = `${playlistUrl}?offset=${offset}`;
      }
    }
  }
  // Save promises here
  const playlistsRequestPromises = playlistURLConfig.map(({ offsetUrl, config }) => {
    return fetch(offsetUrl, config);
  });
  return {
    playlistsRequestPromises,
    playlistNames
  };
};

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
const getFileName = async (access_token: string, user_id: string): Promise<string | Error> => {
  try {
    // Get display name of user
    const baseSpotifyApiUrl = 'https://api.spotify.com/v1';	
    const spotifyUserParams = (user_id === '') ? '/me' : `/users/${user_id}`;
    const getFileNameUrl = `${baseSpotifyApiUrl}${spotifyUserParams}`;
    const options = { 
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      }
    };
    const response = await fetch(getFileNameUrl, options);
    if(response.status !== 200) {
      throw new Error('There was an error retrieving the file name.');
    }
    const data: { display_name: string } = await response.json();
    // Get the display_name
    const displayName = data['display_name'];
    const displayNameUTF8 = parseStringToUTF8(displayName);
    // Use the user_id as xlsx_file_name
    let xlsxFileName = user_id;
    // However, if display_name is a non-empty string, use the display_name as xlsx_file_name
    if (typeof displayNameUTF8 === 'string' && displayNameUTF8.trim().length > 0) {
      // Replace spaces with underscores ("_")
      xlsxFileName = displayNameUTF8.replace(/\s+/g,"_");
    }
    xlsxFileName += ".xlsx";			
    return xlsxFileName;
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
};

/**
 * Summary. Function that writes an excel file from a list of playlists.
 *
 * Description. This function uses a list of playlists to write each playlist in a page. 
 *
 * @param {Map}        user_playlists_map   Map Playlists with spotifyId.
 * @param {Object}     playlist_names       Object containing Playlist IDs and Names.
 * @param {Workbook}   wb                   ('excel4node').Workbook() Object.
 * 
 */
const writeSheets = (user_playlists_map: Map<string, TPlaylistTracks>, playlist_names: {[playlistId: string]: string}, wb: Workbook) => {
  // Create a reusable style
  const headerStyle = wb.createStyle({
    font: {
      bold: true,
      color: '#000000',
      size: 18
    }
  });

  const normalStyle = wb.createStyle({
    font: {
      color: '#000000',
      size: 12
    }
  });

  const linkStyle = wb.createStyle({
    font: {
      size: 12
    }
  });

  // If there are no playlists
  if(user_playlists_map.size <= 0) {
    let ws = wb.addWorksheet("No Playlists");
    ws.cell(1,1,1,4,true).string("This account has not playlists").style(headerStyle);
    return;
  }

  const worksheetNames = new Set<string>();
  // If there is at least one playlist
  user_playlists_map.forEach((userPlaylist) => {
    const tracks = userPlaylist['items'];
    const playlistId = parseStringToUTF8(getIdFromUrl(userPlaylist['href']));
    const playlistName = parseStringToUTF8(playlist_names[playlistId]);
    const worksheetName = parseWorksheetName(playlistName,worksheetNames);
    worksheetNames.add(worksheetName);
    const playlstUrl = `https://open.spotify.com/playlist/${playlistId}`;
    if(tracks.length > 0) {
      // Add Worksheets to the workbook
      let ws = wb.addWorksheet(worksheetName);

      // Set value of cells A1:A6 to playlist_name styled with paramaters of style
      ws.cell(1,1,1,6,true).string(playlistName).style(headerStyle);

      // Set style to playlist url
      ws.cell(2,1).string('Playlist URL:').style(normalStyle);
      ws.cell(2,2,2,6,true).link(playlstUrl).style(normalStyle);

      // Set style to headers
      ws.cell(3,1).string('Artist').style(headerStyle);
      ws.cell(3,2).string('Track').style(headerStyle);
      ws.cell(3,3).string('Album').style(headerStyle);
      ws.cell(3,4).string('Spotify URL').style(headerStyle);
      ws.cell(3,5).string('Added at').style(headerStyle);
      ws.cell(3,6).string('Added by').style(headerStyle);

      let trackRow = 4;
        // Set value of songs to cells and style them with paramaters of style
      tracks.forEach( track => {
        if(!track || !track['track']) {
          return;
        }
        const song = parseStringToUTF8(track['track']['name']);    
        const artist = track['track']['artists']
          .map((artist) => {
            return parseStringToUTF8(artist['name']);
          }).join('; ');
        const album = track['track']['album'];
        const albumUrl = parseStringToUTF8(album['external_urls']['spotify']);
        const albumName = parseStringToUTF8(album['name']);
        const trackUrl = parseStringToUTF8(track['track']['external_urls']['spotify']);
        const addedAt = parseStringToUTF8(track['added_at']);
        const addedBy = track['added_by'];
        const addedByUrl = parseStringToUTF8(addedBy['external_urls']['spotify']);
        const addedById = parseStringToUTF8(addedBy['id']);
        const addedByTooltip = `Added by Spotify id ${addedById}`; 
        ws.cell(trackRow,1).string(artist).style(normalStyle);
        ws.cell(trackRow,2).string(song).style(normalStyle);
        if(typeof albumUrl === 'string') {
          ws.cell(trackRow,3).link(albumUrl, albumName).style(linkStyle);
        } else {
          ws.cell(trackRow,3).string(albumName).style(normalStyle);
        }
        if(typeof trackUrl === 'string') {
          ws.cell(trackRow,4).link(trackUrl).style(linkStyle);
        } else {
          ws.cell(trackRow,4).string('Local').style(normalStyle);
        }
        ws.cell(trackRow,5).string(addedAt).style(normalStyle);
        ws.cell(trackRow,6).link(addedByUrl, addedById, addedByTooltip).style(linkStyle);

        trackRow++;
      });
    } else {
      console.log("No tracks in this list.");
    }
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
const getPlaylistsAndExport = async (access_token: string, user_id: string, wb: Workbook, res: NextResponse) => {
  try {
    const playlists = await getListOfPlaylists(access_token, 0, user_id);
    if(assertIsJsonError(playlists)) {
      const jsonError = playlists as TJsonError;
      const jsonErrorStatus = jsonError['error']['status'] ?? 400;
      return new NextResponse(
        JSON.stringify(playlists),
        { status: jsonErrorStatus }
      );
    }
    let playlistTracks = (playlists as TPlaylists)['items'];
    let playlistOffset = playlistTracks.length;
    const totalNumberOfPlaylists = (playlists as TPlaylists)['total'];
    // If there is more than 50 playlists, retrieve more playlists
    while(playlistOffset < totalNumberOfPlaylists) {
      const temporalPlaylists = await getListOfPlaylists(access_token, playlistOffset, user_id);
      if(assertIsJsonError(temporalPlaylists)) {
        const jsonError = temporalPlaylists as TJsonError;
        const jsonErrorStatus = jsonError['error']['status'] ?? 400;
        return new NextResponse(
          JSON.stringify(temporalPlaylists),
          { status: jsonErrorStatus }
        );
      }
      const additionalPlaylistTracks = (temporalPlaylists as TPlaylists)['items'];
      playlistTracks = [...playlistTracks,...additionalPlaylistTracks];
      playlistOffset += additionalPlaylistTracks.length;
    }
    const { playlistsRequestPromises, playlistNames } = await getRequestsPromisesAndNamesForEachPlaylist(access_token, playlistTracks, user_id);
    const userPlaylistsMap = new Map<string, TPlaylistTracks>();
    const playlistResponses = await Promise.all(playlistsRequestPromises);
    const playlistsTracks: TPlaylistTracks[] = await Promise.all(playlistResponses.map(playlistResponse => {
      if(playlistResponse.status !== 200) {
        throw Error(`There was a problem with request`);
      }
      return playlistResponse.json();
    }));
    playlistsTracks.forEach( (playlistTracks) => {
      const currentPlaylistId = getIdFromUrl(playlistTracks['href']);
      if (userPlaylistsMap.has(currentPlaylistId)) {
        // Add to previous position
        const currentPlayListItems = userPlaylistsMap.get(currentPlaylistId);
        currentPlayListItems?.items.push(...playlistTracks['items']);
      } else {
        // Update new uri
        userPlaylistsMap.set(currentPlaylistId, playlistTracks);
      }
    });

    writeSheets(userPlaylistsMap, playlistNames, wb);

    const xlsxFileName =  await getFileName(access_token, user_id);

    if(typeof xlsxFileName === 'string') {
      const buffer = await wb.writeToBuffer();
      let headers = {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-disposition': `attachment; filename=${xlsxFileName}`
      }
      return new NextResponse(buffer,{ headers });
    } else {
      throw xlsxFileName;
    }
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
};

export const GET = async (
  req: NextRequest
) => {
  if(req.method !== 'GET') {
    return new NextResponse(
      JSON.stringify({ error: `Unauthorized method` }),
      { status: 400 }
    );
  }
  try {
    // const session = await getSession({ req });
    const session = await auth();
    const userId = session?.user?._id;
    if(typeof userId !== 'string') {
      return new NextResponse(
        JSON.stringify({ error: `There was a problem with the session.` }),
        { status: 400 }
      );
    }
    const db = await getMongoDb();
    const account: AccountModel | null = await findAccountById(db, userId);
    
    if(!account ||
      !account.access_token ||
      !account.refresh_token ||
      !account.providerAccountId ||
      !account.expires_at
    ) {
      return new NextResponse(
        JSON.stringify({ error: `There was a problem with the account.` }),
        { status: 400 }
      );
    }
    const accessToken = account.access_token;
    let accountOwnerType = req.nextUrl.searchParams.get('value');
    if (accountOwnerType !== 'own' && accountOwnerType !== 'other') {
      return new NextResponse(
        JSON.stringify({ error: `There was a problem defining the account owner type.` }),
        { status: 400 }
      );
    }
    let isMyAccount = (req.nextUrl.searchParams.get('value') === 'own');
    let spotifyId = isMyAccount ? account.providerAccountId : req.nextUrl.searchParams.get('spotifyId');
    const currentDate = Date.now();
    const tokenExpirationDate = account.expires_at;
    const diffDate = tokenExpirationDate - currentDate;
    let validatedAccessToken = accessToken;
    
    // verifyTokenAndGetAccessToken
    if(diffDate < 1000) {
      const spotifyClientId = process.env.AUTH_SPOTIFY_ID;
      const spotifyClientSecret = process.env.AUTH_SPOTIFY_SECRET;
      const accessTokenResponse = await refreshSpotifyToken(db, userId, spotifyClientId, spotifyClientSecret, account.refresh_token);
      if(typeof accessTokenResponse !== 'string') {
        throw accessTokenResponse;
      }
      validatedAccessToken = accessTokenResponse;
    }
    // If the request is for other spotify user
    if(typeof spotifyId !== 'string' || spotifyId.trim() === '') {
      spotifyId = account.providerAccountId;
    }
    /* Verify if user has Spotify API permission to continue */
    const spotifyUserExists = await createSpotifyUserExistsJSON(validatedAccessToken, spotifyId);
    if(spotifyUserExists.status !== 200) {
      return new NextResponse(
        JSON.stringify(spotifyUserExists.json),
        { status: spotifyUserExists.status }
      );
    }
    const response = await getListOfPlaylists(accessToken, 0, spotifyId);
    if(assertIsJsonError(response)) {
      const errorResponse = response as TJsonError;
      const errorStatus = errorResponse.error.status ?? 400;
      const errorMessage = errorResponse.error.message;
      return new NextResponse(
        JSON.stringify({ error: errorMessage }),
        { status: errorStatus }
      );
    }
    const wb = new xl.Workbook();
    const res = await getPlaylistsAndExport(validatedAccessToken, spotifyId, wb, NextResponse.next());
    return res;
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      { status: 400 }
    );
  }
}
