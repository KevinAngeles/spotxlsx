import { getErrorMessage } from '@/utils/index';
import { ObjectId, Db } from 'mongodb';
import { TErrorWithMessage, TJsonStatus } from '@/types/types';

/**
 * Summary. Function that validates if a Spotify ID exists.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token.
 * If the ID exists returns true, otherwise, it returns an object containing the error message
 * and the status.
 *
 * @param {String}  acces_token        Access token required for Spotify request.
 * @param {String}  user_id            Spotify Id to validate.
 * 
 * @return {Promise<boolean | TErrorWithMessage>} user exists
 */
export const verifySpotifyUserExists = async (access_token: string, user_id: string): Promise<boolean | TErrorWithMessage> => {
	try {
    const spotifyApiUrl = `https://api.spotify.com/v1/users/${user_id}`;
    const options = { 
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      }
    };
    const response = await fetch(spotifyApiUrl, options);
    if(response.status === 403) {
      return { message: 'You do not have permission to use this application. Please, contact an admin to register you.', status: 403 }
    } else if(response.status === 200) {
      return true;
    }
    return { message: 'Invalid spotify id.', status: 404 };
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    return { message: errorMessage, status: 400 };
  }
};


/**
 * Summary. Function that validates if a Spotify ID exists.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token.
 * If the ID exists returns true, otherwise, it returns an object containing the error message
 * and the status.
 *
 * @param {String}  acces_token        Access token required for Spotify request.
 * @param {String}  spotify_id         Spotify Id to validate.
 * 
 * @return {Promise<boolean | TErrorWithMessage>} user exists
 */
export const createSpotifyUserExistsJSON = async (access_token: string, spotify_id: string): Promise<TJsonStatus> => {
	try {
    const spotifyUserExists = await verifySpotifyUserExists(access_token, spotify_id);
    const generalErrorMessage = 'There was a problem with the account.';
    if(typeof spotifyUserExists !== 'boolean') {
      const errorMessage = spotifyUserExists['message'];
      const errorStatus = spotifyUserExists['status'] ?? 400;
      const errorDetails: { message: string, type: 'input' | 'forbidden' } = { message: errorMessage, type: 'input' };
      if( errorStatus === 403 ) {
        errorDetails['type'] = 'forbidden';
      }
      if( errorStatus === 403 || errorStatus === 404 ) {
        return { status: errorStatus, json: { error: generalErrorMessage, errorDetails: errorDetails} };
      }
      return { status: 400, json: { error: generalErrorMessage } };
    } else if(!spotifyUserExists) {
      return { status: 400, json: { error: generalErrorMessage } };
    }
    return { status: 200, json: { message: 'User is allowed to continue.' } };
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    return { status: 400, json: { error: errorMessage } };
  }
};

/**
 * Summary. Function that updates access token, refresh token, and token expiration date.
 *
 * Description. The function updates access token, refresh token and token expiration date in the
 *  database using an spotify ID. It returns true, if the update was successfull. Otherwise, it
 *  returns false.
 *
 * @param {Db}             db                 MongoDB Database
 * @param {String}         userId             Spotify Id to validate.
 * @param {String}         accessToken        Access token required for Spotify request.
 * @param {String}         refreshToken       Current refresh token.
 * @param {Number}         expirationDate     Token epoch expiration date.
 * 
 * @return {Promise<boolean>} user exists
 */
export const updateAccountToken = async (db: Db, userId: string, accessToken: string, refreshToken: string, expirationDate: number): Promise<boolean> => {
  try {
    const result = await db.collection('accounts').updateOne(
      { userId: new ObjectId(userId) },
      {
        $set: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expirationDate,
        },
      },
      { upsert: false }
    );
    return (result.modifiedCount > 0);
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
};
