import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./utils/db.js";

const port = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Darsgah API running on port ${port}`);
  });
});
