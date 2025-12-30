import app from "./src/app";
import initSocketServer from "./src/sockets/socket.server";
import http from "http";

const httpServer = http.createServer(app);

initSocketServer(httpServer);



httpServer.listen(3005, () => {
    console.log(`Server is running on port 3005`);
});