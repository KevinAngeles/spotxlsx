import { getErrorMessage } from "./errorHandler";

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
  const currentDate = Date.now();
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
      newExpirationDate: (typeof newExpirationDate === 'number') ?  newExpirationDate : null,
    };
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}
