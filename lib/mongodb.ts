import { MongoClient } from 'mongodb';

const mongoDbUri = process.env.MONGODB_URI;

if (!mongoDbUri || mongoDbUri.trim() === '') {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const processMode = process.env.NODE_ENV;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if(processMode === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if(!global._mongoClientPromise) {
    client = new MongoClient(mongoDbUri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(mongoDbUri, options);
  clientPromise = client.connect();
}

export const getMongoDb = async () => {
  const mongoClient = await clientPromise;
  return mongoClient.db();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
