const express = require('express');
const cookierParser = require('cookie-parser');
const productRoutes = require('./routes/product.routes');
const app = express();


app.use(express.json());
app.use(cookierParser());


app.use('/api/products', productRoutes);

module.exports = app;