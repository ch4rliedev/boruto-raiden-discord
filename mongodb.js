import { MongoClient, ServerApiVersion } from 'mongodb';

const mongoclient = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let userDB, infoGameDB, jutsuDB, itemDB, invDB, clanDB;

async function connectToMongoDB() {
  try {
    await mongoclient.connect();
    const db = mongoclient.db('borutoraiden');
    userDB = db.collection('users');
    infoGameDB = db.collection('infoGame');
    jutsuDB = db.collection('jutsus');
    itemDB = db.collection('items');
    invDB = db.collection('invs');
    clanDB = db.collection('clans');
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  }
}

connectToMongoDB();

export { userDB, infoGameDB, jutsuDB, itemDB, invDB, clanDB};