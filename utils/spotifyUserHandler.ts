import { getErrorMessage } from "./errorHandler";
import { ObjectId, Db } from 'mongodb';

/**
 * Summary. Function that validates if a Spotify ID exists.
 *
 * Description. The function makes a get request to Spotify using an ID and an access token.
 * If the ID exists returns true, otherwise, it returns false.
 *
 * @param {String}  acces_token        Access token required for Spotify request.
 * @param {String}  user_id            Spotify Id to validate.
 * 
 * @return {Promise<boolean>} user exists
 */
export const verifySpotifyUserExists = async (access_token: string, user_id: string): Promise<boolean> => {
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
    return response.ok;
  } catch(error) {
    return false;
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
 * @param {String | null}  refreshToken       Current refresh token.
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
