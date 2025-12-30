import { Server,Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { parse } from "cookie";
import jwt from "jsonwebtoken";


interface AuthSocket extends Socket {
    user?: string | jwt.JwtPayload;
    token?: string;
}

async function initSocketServer(httpServer: HttpServer) {
    const io= new Server(httpServer, {
       
    });

    io.use((socket:Socket, next) => {
        const authSocket = socket as AuthSocket;
       const cookieHeader = socket.handshake.headers.cookie;
     const cookies = cookieHeader ? parse(cookieHeader) : {};
        const { token } = cookies;

         if (!token) {
            return next(new Error('Token not provided'));
        }
        try {
            const decoded= jwt.verify(token, process.env.JWT_SECRET as string);

            authSocket.user = decoded;
            authSocket.token = token;

            next()
        } catch (error) {
            return next(new Error('Authentication error'));
            
        }
      
    });
    

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

       
        

        socket.on("disconnect", () => {
            
        });
    });

   
    
}


export default initSocketServer;