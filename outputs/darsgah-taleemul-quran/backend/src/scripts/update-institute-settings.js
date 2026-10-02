import dotenv from "dotenv";
import mongoose from "mongoose";
import { Setting } from "../models/ErpModels.js";

dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is required");
}

const instituteDetails = {
  name: "DARSGAH TALEEMUL QURAN WAL HADITH",
  location: "Kongamdara Pattan, Jammu & Kashmir",
  phone: "+919906237556",
  mapUrl:
    "https://www.google.com/maps/place/34%C2%B007'04.8%22N+74%C2%B035'12.4%22E/@34.1182154,74.5868014,19z/data=!4m4!3m3!8m2!3d34.1179956!4d74.5867706?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D",
  mapEmbedUrl: "https://www.google.com/maps?q=34.1179956,74.5867706&z=18&output=embed"
};

try {
  await mongoose.connect(process.env.MONGO_URI);
  const current = await Setting.findOne({ key: "institute" }).lean();
  await Setting.updateOne(
    { key: "institute" },
    { $set: { value: { ...(current?.value || {}), ...instituteDetails } } },
    { upsert: true }
  );
  console.log("Institute contact and map settings updated.");
} finally {
  await mongoose.disconnect();
}
