import { ObjectId, Db } from 'mongodb';

export async function findAccountById(db: Db, userId: string) {
  return db
    .collection('accounts')
    .findOne({ userId: new ObjectId(userId) })
    .then((account) => account);
};
