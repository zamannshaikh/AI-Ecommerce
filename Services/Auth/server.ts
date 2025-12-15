import app from './src/app.js'; // 1. Import using the modern syntax
import { connectDB } from './src/db/db.js';

const PORT = 3000;

connectDB();


app.get('/', (req, res) => {
  res.send('Hello, World!');
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});