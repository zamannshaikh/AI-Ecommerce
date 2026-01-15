import express from 'express';
import { connectToRabbitMQ } from './utils/rabbitmq';
import { startConsumers } from './events/consumers';

// Initialize RabbitMQ connection and start consumers
connectToRabbitMQ();
startConsumers();

const app = express();






export default app;