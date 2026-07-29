import mongoose from "mongoose";

let connectionPromise;

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is required");
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
    await connectionPromise;
    console.log("MongoDB connected");
    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    console.error("");
    console.error("MongoDB connection failed.");
    console.error(`Tried: ${uri.startsWith("mongodb+srv://") ? "MongoDB Atlas connection string" : uri}`);
    console.error("");
    console.error("Fix:");
    console.error("1. Start MongoDB service, or run MongoDB manually:");
    console.error('   mongod --dbpath C:\\data\\db');
    console.error("2. If mongod is not recognized, run scripts\\start-local-mongodb.ps1 from the project root.");
    console.error("3. Then run: npm run seed && npm run dev");
    console.error("");
    throw error;
  }
}
