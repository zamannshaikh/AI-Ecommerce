import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import agent from "../agent/agent"; // <--- 1. Import your Agent

interface AuthSocket extends Socket {
    user?: string | jwt.JwtPayload;
    token?: string;
}

async function initSocketServer(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // Configure this securely for production!
            methods: ["GET", "POST"]
        }
    });

    // --- Authentication Middleware ---
    io.use((socket: Socket, next) => {
        const authSocket = socket as AuthSocket;
        const cookieHeader = socket.handshake.headers.cookie;
        const cookies = cookieHeader ? parse(cookieHeader) : {};
        const { token } = cookies;

        if (!token) {
            return next(new Error('Token not provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

            // Attach user and token to the socket session
            authSocket.user = decoded;
            authSocket.token = token;

            next();
        } catch (error) {
            return next(new Error('Authentication error'));
        }
    });

    // --- Connection Handler ---
    io.on("connection", (socket: Socket) => {
        const authSocket = socket as AuthSocket;
        console.log("New client connected:", authSocket.id);
        console.log("User:", authSocket.user);
        console.log("Socket Token:", authSocket.token ? "Present" : "MISSING");
        // Listen for messages from the Frontend
        socket.on("message", async (data: string) => {
            console.log(`Received message from ${authSocket.id}:`, data);

            try {
                // 2. Invoke the Agent
                const agentResponse = await agent.invoke(
                    {
                        messages: [
                            {
                                role: "user",
                                content: data
                            }
                        ]
                    },
                   
                    {
                        // 3. PASS THE TOKEN! This is crucial for your Tools to work.
                        metadata: {
                            token: authSocket.token
                        }
                    }
                );

                // 4. Extract the final text response
                const lastMessage = agentResponse.messages[agentResponse.messages.length - 1];
                console.log("Agent response:", lastMessage);
                // 5. Send reply back to Frontend
                socket.emit("message", lastMessage.content);

            } catch (error: any) {
                console.error("Agent Error:", error);
                socket.emit("message", "Sorry, I encountered an error processing your request.");
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
}

export default initSocketServer;