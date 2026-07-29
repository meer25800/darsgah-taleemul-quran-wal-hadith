import dotenv from "dotenv";
import app from "../src/app.js";
import { connectDB } from "../src/utils/db.js";

dotenv.config();

let ready;

export default async function handler(req, res) {
  if (req.url?.startsWith("/health")) {
    return app(req, res);
  }

  ready ||= connectDB();
  await ready;
  return app(req, res);
}
