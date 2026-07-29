import dotenv from "dotenv";
import mongoose from "mongoose";
import { Video } from "../models/Content.js";
import { extractYouTubeVideoId } from "../utils/youtube.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const videos = await Video.find({}).sort("-updatedAt -createdAt");
const seen = new Set();
let hidden = 0;

for (const video of videos) {
  const id = video.youtubeVideoId || extractYouTubeVideoId(video.youtubeUrl);
  if (!id) continue;
  if (id === "dQw4w9WgXcQ" || seen.has(id)) {
    video.youtubeVideoId = undefined;
    video.published = false;
    video.showOnHome = false;
    hidden += 1;
  } else {
    video.youtubeVideoId = id;
    seen.add(id);
  }
  await video.save();
}

console.log(`Video cleanup complete. Hidden ${hidden} duplicate/demo video record(s).`);
await mongoose.disconnect();
