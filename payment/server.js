require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 4000;
const connectDB = require('./src/db/db');
const {connect} = require('./src/broker/broker');


// Connect to RabbitMQ and set up listeners 
connect()

// Connect to the database
connectDB();


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});