import { findAccountById } from '@/lib/db/account';
import AccountModel from '@/lib/models/AccountModel';
import { getMongoDb } from '@/lib/mongodb';
import { createSpotifyUserExistsJSON, getErrorMessage, refreshSpotifyToken } from '@/utils/index';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const POST = async (
  req: NextRequest
) => {
  try {
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
    const currentDate = Date.now();
    const tokenExpirationDate = account.expires_at;
    const diffDate = tokenExpirationDate - currentDate;
    let validatedAccessToken = accessToken;
    const spotifyAccountId = account.providerAccountId;

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
    /* Verify if user has Spotify API permission to continue */
    const spotifyUserExists = await createSpotifyUserExistsJSON(validatedAccessToken, spotifyAccountId);
    return new NextResponse(
      JSON.stringify(spotifyUserExists.json),
      { status: spotifyUserExists.status }
    );
  } catch(error) {
    const errorMessage = getErrorMessage(error);
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      { status: 400 }
    );
  }
}
