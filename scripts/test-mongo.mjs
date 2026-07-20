import "dotenv/config";
import { MongoClient } from "mongodb";

const srvUrl = process.env.DATABASE_URL;
if (!srvUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const credMatch = srvUrl.match(/mongodb\+srv:\/\/([^@]+)@/);
if (!credMatch) {
  console.error("Expected mongodb+srv:// URL");
  process.exit(1);
}

const directUrl =
  `mongodb://${credMatch[1]}@` +
  "ac-xg2dhtt-shard-00-00.chszdxy.mongodb.net:27017," +
  "ac-xg2dhtt-shard-00-01.chszdxy.mongodb.net:27017," +
  "ac-xg2dhtt-shard-00-02.chszdxy.mongodb.net:27017/worthkart" +
  "?ssl=true&replicaSet=atlas-ii0bsl-shard-0&authSource=admin&retryWrites=true&w=majority";

async function tryConnect(label, url, options = {}) {
  try {
    const client = new MongoClient(url, {
      serverSelectionTimeoutMS: 15000,
      ...options,
    });
    await client.connect();
    await client.db("worthkart").command({ ping: 1 });
    console.log(`${label}: OK`);
    await client.close();
    return true;
  } catch (error) {
    console.error(`${label}: FAIL —`, error.message);
    return false;
  }
}

console.log("Testing MongoDB Atlas connection...\n");
await tryConnect("SRV (mongodb+srv)", srvUrl);
await tryConnect("Direct (mongodb://)", directUrl, { family: 4 });
