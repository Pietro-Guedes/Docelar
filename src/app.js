const express = require('express')
const cors = require('cors')
const app = express()
const route = require('./routes')

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaderS: ["Content-Type","Autorization"],
    })
)

app.use(cors())
app.use(express.json())

app.use('/', routes)

module.exports = app