import { getErrorMessage, updateAccountToken } from '@/utils/index';
import { Db } from 'mongodb';

/**
 * Summary. Function that refresh access_token if required.
 *
 * Description. This function detects if the access token is still valid. It checks in the database
 * if the access_token has not expired and if it detects that the access_token needs to be refreshed, 
 * it makes a request to spotify using the saved refresh_token in order to get a new access_token.
 * This function returns a promise containing the access_token.
 *
 * @param {String}  refresh_token       Refresh token that will be used to renew access token.
 * @param {String}  app_key             App client.
 * @param {String}  app_secret          App secret.
 * 
 * @return Object containing accessToken, refreshToken and expirationDate
 */
export const getAccessAndRefreshToken = async (refresh_token: string, app_key: string, app_secret: string) => {
	// access_token must be renewed
  const authorization_code = "Basic " + (Buffer.from(`${app_key}:${app_secret}`).toString('base64'));
  // Request new access_token using refresh_token
  const urlParams = new URLSearchParams();
  urlParams.set('grant_type', 'refresh_token');
  urlParams.set('refresh_token', refresh_token);
  const refreshTokenUrl = `https://accounts.spotify.com/api/token?${urlParams.toString()}`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type' : 'application/x-www-form-urlencoded',
      'Authorization': authorization_code
    }
  };
  try {
    const response = await fetch(refreshTokenUrl, options);
    if(!response.ok) {
      throw new Error('There was an error refreshing the token.');
    }
    const data = await response.json();
    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token;
    const newExpirationDate = data.expires_in;
    if(typeof newAccessToken !== 'string') {
      throw new Error('Incorrect access token.');
    }
    return {
      newAccessToken: newAccessToken,
      newRefreshToken: (typeof newRefreshToken === 'string' && newRefreshToken !== '') ? newRefreshToken : null,
      newExpirationDate: (typeof newExpirationDate === 'number') ? Date.now() + newExpirationDate * 1000 : null,
    };
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Summary. Function that refresh access_token if required.
 *
 * Description. This function detects if the access token is still valid. It checks in the database
 * if the access_token has not expired and if it detects that the access_token needs to be refreshed, 
 * it makes a request to spotify using the saved refresh_token in order to get a new access_token.
 * This function returns a promise containing the access_token.
 *
 * @param {Db}      db                   MongoDB Database
 * @param {String}  userId               Spotify User Id
 * @param {String}  spotifyClientId      Spotify App Client Id
 * @param {String}  spotifyClientSecret  Spotify App Secret
 * @param {String}  currentRefreshToken  Refresh token that will be used to renew access token.
 * 
 * @return {<Promise<String | Error>>} new Access Token or Error
 */
export const refreshSpotifyToken = async (
  db: Db,
  userId: string,
  spotifyClientId: string | undefined,
  spotifyClientSecret: string | undefined,
  currentRefreshToken: string
): Promise<string | Error> => {
  try {
    if(typeof(spotifyClientId) !== 'string' || spotifyClientId.trim() === '') {
      throw new Error('Spotify Client Id not setted.');
    }
    if(typeof(spotifyClientSecret) !== 'string' || spotifyClientSecret.trim() === '') {
      throw new Error('Spotify Client Secret not setted.');
    }
    const { newAccessToken, newRefreshToken, newExpirationDate } = await getAccessAndRefreshToken(currentRefreshToken, spotifyClientId, spotifyClientSecret);
    if(!newExpirationDate) {
      throw new Error('Token was not refreshed.');
    }
    const refreshToken = newRefreshToken ?? currentRefreshToken;
    const tokenUpdated = await updateAccountToken(db, userId, newAccessToken, refreshToken, newExpirationDate);
    if(!tokenUpdated) {
      throw new Error('There was an error updating user in the database.');
    }
    return newAccessToken;
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    return new Error(errorMessage);
  }
};
