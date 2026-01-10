require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 4000;
const connectDB = require('./src/db/db');

// Connect to the database
connectDB();


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});