import app from "./src/app.js";
import { connectDB } from "./src/db/db.js";
import { connectToRabbitMQ } from "./src/utils/rabbitmq.js";

connectDB();
connectToRabbitMQ();



app.listen(3003, () => {
  console.log("Order Service is running on port 3003");
});