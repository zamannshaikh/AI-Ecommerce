// src/events/consumer.ts
import { subscribeToQueue } from "../utils/rabbitmq";
import { sendNotification } from "../utils/email";




export const startConsumers = async () => {
  

    // --- LISTENER 1: User Registration ---
    await subscribeToQueue("user_registration", async (data: any) => {


        const emailHtml = `
        <div style="background-color: #f4f4f7; padding: 40px 20px; font-family: 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333333; font-size: 24px; margin: 0;">AI E-Commerce</h1>
            </div>

            <p style="font-size: 16px; color: #555555; line-height: 1.6;">
              Hi <strong>${data.fullName.firtName}</strong>,
            </p>
            <p style="font-size: 16px; color: #555555; line-height: 1.6;">
              Welcome to the future of shopping! 🚀 <br>
              Your account has been successfully created. We are excited to help you find exactly what you need using our AI-powered tools.
            </p>

            <div style="text-align: center; margin: 35px 0;">
              <a href="http://localhost:3000" style="background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                Start Shopping
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">
              © ${new Date().getFullYear()} AI E-Commerce. All rights reserved.<br>
              <a href="#" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
            </p>
          </div>
        </div>
        `;
        console.log("📨 Received User Registration Event:", data);

        // Send the Welcome Email
        await sendNotification({
            to: data.email,
            subject: "Welcome to AI E-commerce!",
            text: `Hi ${data.fullName.firtName}, thank you for registering!`,
            html: emailHtml
        });
    });

   await subscribeToQueue("order_notifications", async (data: any) => {
        console.log("📨 Received Email Notification Event:", data);
        const emailHtml = `
        <div style="background-color: #f4f4f7; padding: 40px 20px; font-family: 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; padding: 12px; background-color: #d1fae5; border-radius: 50%;">
                <span style="font-size: 30px; color: #059669;">✓</span>
              </div>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333333; font-size: 24px; margin: 0;">Order Confirmed!</h1>
              <p style="color: #777777; margin-top: 10px;">Thank you for your purchase.</p>
            </div>

            <div style="background-color: #f9fafb; border: 1px solid #eeeeee; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
              <p style="margin: 0 0 10px 0; color: #555555; font-size: 14px;">
                <strong>Order ID:</strong> <span style="font-family: monospace; color: #333333;">${data.orderId}</span>
              </p>
              <p style="margin: 0; color: #555555; font-size: 18px;">
                <strong>Total Amount:</strong> <span style="color: #059669; font-weight: bold;">$${Number(data.amount).toFixed(2)}</span>
              </p>
            </div>

            <p style="font-size: 16px; color: #555555; line-height: 1.6; text-align: center;">
              We are getting your package ready! You will receive another notification once your items have shipped.
            </p>

            <div style="text-align: center; margin: 35px 0;">
              <a href="http://localhost:3000/orders/${data.orderId}" style="background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                View Order Status
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999999; text-align: center;">
              Need help? <a href="#" style="color: #4F46E5; text-decoration: none;">Contact Support</a>
            </p>
          </div>
        </div>
        `;
        await sendNotification({
            to: data.email,
            subject: `Order Confirmed #${data.orderId.slice(-6)}`, // Shows last 6 chars of ID in subject
            text: `Your order #${data.orderId} for $${data.amount} has been confirmed.`,
            html: emailHtml
        });
   });
};