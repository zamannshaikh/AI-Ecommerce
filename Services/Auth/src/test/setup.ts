import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer;

// Run this BEFORE all tests start
export const connectDB = async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.JWT_SECRET = 'testsecret'; // Set a test JWT secret
  await mongoose.connect(uri);
};

// Run this AFTER all tests finish
export const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
};

// Run this after EACH individual test (cleanup)
export const clearDB = async () => {
  const collections = mongoose.connection.collections;

 if(collections){
     for (const key in collections) {
        const collection = collections[key];
      await collection.deleteMany({});
  } 
 }
};