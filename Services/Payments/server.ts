import app from "./src/app";
import { connectDB } from "./src/db/db";

connectDB();








app.listen(3004, () => {
  console.log("Payments service is running on port 3004");
});