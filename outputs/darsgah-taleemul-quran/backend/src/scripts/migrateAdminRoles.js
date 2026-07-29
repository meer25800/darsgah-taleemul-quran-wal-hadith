import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const ownerEmail = "aamirmir08@gmail.com";
const owner = await User.findOne({ username: ownerEmail }).select("+password");
if (owner) {
  owner.role = "super_admin";
  owner.email = ownerEmail;
  owner.isActive = true;
  await owner.save();
  console.log("Primary owner account migrated to super_admin.");
} else {
  console.log("Primary owner account not found. Run npm run seed or create it first.");
}

await mongoose.disconnect();
