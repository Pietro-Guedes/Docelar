const express = require('express')
const cors = require('cors')
const app = express()
const routes = require('./routes')
const path = require('path');

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

app.use(express.json())

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', routes)

module.exports = app