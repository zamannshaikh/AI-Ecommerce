import amqplib from 'amqplib';


let connection: any = null;
let channel: any = null;


export const connectToRabbitMQ = async (): Promise<void> => {
    if (connection && channel) return;

    try {
        console.log("⏳ Connecting to RabbitMQ...");
        
        connection = await amqplib.connect(process.env.RABBIT_URL as string);
        console.log("✅ Connected to RabbitMQ successfully");

        channel = await connection.createChannel();

        connection.on("close", () => {
            console.error("❌ RabbitMQ connection closed");
            connection = null;
            channel = null;
        });

    } catch (error) {
        console.error("❌ Error connecting to RabbitMQ:", error);
        throw error; 
    }
};


export const publishToQueue = async <T>(queueName: string, data: T): Promise<void> => {
    try {
        if (!channel || !connection) await connectToRabbitMQ();

        await channel.assertQueue(queueName, { durable: true });

        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
            persistent: true 
        });

        console.log(`📤 Message sent to queue '${queueName}'`);
    } catch (error) {
        console.error(`❌ Failed to publish to ${queueName}:`, error);
    }
};

/**
 * Subscribes to a queue and processes messages.
 * @param queueName - The name of the queue
 * @param callback - A function to handle the incoming data
 */
export const subscribeToQueue = async <T>(
    queueName: string, 
    callback: (data: T) => Promise<void>
): Promise<void> => {
    try {
        if (!channel || !connection) await connectToRabbitMQ();

        await channel.assertQueue(queueName, { durable: true });

        // 'prefetch(1)' ensures the consumer only gets 1 message at a time
        channel.prefetch(1);

        console.log(`🎧 Waiting for messages in '${queueName}'...`);

        channel.consume(queueName, async (msg: any) => {
            if (msg !== null) {
                try {
                    const data: T = JSON.parse(msg.content.toString());
                    await callback(data);
                    channel.ack(msg);
                } catch (processError) {
                    console.error("❌ Error processing message:", processError);
                    // channel.nack(msg, false, false); // Optional: discard if failed
                }
            }
        });
    } catch (error) {
        console.error(`❌ Failed to subscribe to ${queueName}:`, error);
    }
};