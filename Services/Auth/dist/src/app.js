import express from 'express';
import cookierParser from 'cookie-parser';
import { connect } from 'node:http2';
import { connectDB } from './db/db.js';
const app = express(); // 2. Add Type Annotation ': Application'
app.use(express.json());
app.use(cookierParser());
// Middleware and routes go here...
connectDB();
export default app; // 3. Use 'export default'
//# sourceMappingURL=app.js.map