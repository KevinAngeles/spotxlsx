import { ObjectId } from 'mongodb';

type AccountModel = {
  _id: ObjectId;
  provider?: string;
  type?: string;
  providerAccountId?: string;
  access_token?: string;
  token_type?: string;
  expires_at?: number;
  refresh_token?: string;
  scope?: string | null;
  userId?: ObjectId;
}

export default AccountModel;
