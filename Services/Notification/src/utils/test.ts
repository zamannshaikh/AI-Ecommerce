// // src/services/test-email.ts
// import { sendNotification } from "./email";

// async function runTest() {
//   console.log("🚀 Starting Email Test...");

//   // Replace this with your actual personal email to verify you receive it
//   const recipient = "zaman.221245.co@mhssce.ac.in"; 

//   const result = await sendNotification({
//     to: recipient,
//     subject: "Test Email from AI Agent",
//     text: "This is a plain text test from your Node.js application.",
//     html: `
//       <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
//         <h1 style="color: #4CAF50;">Success! 🎉</h1>
//         <p>Your <b>AI Agent Email Service</b> is configured correctly.</p>
//         <p>Sent at: ${new Date().toLocaleString()}</p>
//       </div>
//     `
//   });

//   if (result) {
//     console.log(`✅ Test Passed: Check your inbox at ${recipient}`);
//   } else {
//     console.error("❌ Test Failed: Check the error logs above.");
//   }
// }

// runTest();