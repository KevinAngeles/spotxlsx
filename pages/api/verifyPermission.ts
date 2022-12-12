import { findAccountById } from '@/lib/db/account';
import AccountModel from '@/lib/models/AccountModel';
import { getMongoDb } from '@/lib/mongodb';
import { createSpotifyUserExistsJSON, getErrorMessage, refreshSpotifyToken } from '@/utils/index';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession({ req });
    const userId = session?.user?._id;
    if(typeof userId !== 'string') {
      return res.status(400).json({ error: `There was a problem with the session.` });
    }
    const db = await getMongoDb();
    const account: AccountModel | null = await findAccountById(db, userId);
  
    if(!account ||
      !account.access_token ||
      !account.refresh_token ||
      !account.providerAccountId ||
      !account.expires_at
    ) {
      return res.status(400).json({ error: `There was a problem with the account.` });
    }
    const accessToken = account.access_token;
    const currentDate = Date.now();
    const tokenExpirationDate = account.expires_at;
    const diffDate = tokenExpirationDate - currentDate;
    let validatedAccessToken = accessToken;
    const spotifyAccountId = account.providerAccountId;

    // verifyTokenAndGetAccessToken
    if(diffDate < 1000) {
      const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
      const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      const accessTokenResponse = await refreshSpotifyToken(db, userId, spotifyClientId, spotifyClientSecret, account.refresh_token);
      if(typeof accessTokenResponse !== 'string') {
        throw accessTokenResponse;
      }
      validatedAccessToken = accessTokenResponse;
    }
    /* Verify if user has Spotify API permission to continue */
    const spotifyUserExists = await createSpotifyUserExistsJSON(validatedAccessToken, spotifyAccountId);
    return res.status(spotifyUserExists.status).json(spotifyUserExists.json);
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    return res.status(400).json({ error: errorMessage });
  }
}
