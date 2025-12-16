import app from './src/app.js';
import { connectDB } from './src/db/db.js';

const PORT = 3001;
connectDB();







app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});