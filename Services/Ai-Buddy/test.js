// test-gemini.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  console.log("1. Checking API Key...");
  if (!process.env.GOOGLE_API_KEY) {
    console.error("❌ ERROR: GOOGLE_API_KEY is missing from .env");
    return;
  }
  console.log("   Key found (starts with):", process.env.GOOGLE_API_KEY.substring(0, 5) + "...");

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    console.log("2. Sending request to Google...");
    const result = await model.generateContent("Say hello");
    console.log("✅ SUCCESS! Response:", result.response.text());
  } catch (error) {
    console.error("❌ FAILED:", error.message);
    if (error.message.includes("404")) {
      console.log("   -> This usually means the model name is wrong OR the library version is too old.");
    }
  }
}

test();