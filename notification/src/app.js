const express = require('express');
const {connect} = require('./broker/broker');
const setListeners = require('./broker/listener');
const app = express();

// Connect to RabbitMQ
connect().then(() => {
    // Set up message queue listeners
    setListeners();
}).catch((error) => {
    console.error('Failed to connect to RabbitMQ:', error);
});
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Notification service is running"
    });
})
mopdule.exports = app;