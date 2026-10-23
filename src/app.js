const express = require('express')
const cors = require('cors')
const app = express()
const routes = require('./routes')
const path = require('path');
const fs = require('fs');

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

app.use(express.json())

const pastaUploads = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(pastaUploads));
app.use('/api/uploads', express.static(pastaUploads));

const pastaSite = path.join(__dirname, '..', 'docelar-front', 'dist');
const siteCompilado = fs.existsSync(path.join(pastaSite, 'index.html'));

if (siteCompilado) {
    app.use(express.static(pastaSite, { index: false }));

    app.use((req, res, next) => {
        const ehPaginaDoSite = req.method === 'GET'
            && !req.path.startsWith('/api')
            && !req.path.startsWith('/uploads')
            && req.accepts(['json', 'html']) === 'html';
        if (!ehPaginaDoSite) return next();
        res.sendFile(path.join(pastaSite, 'index.html'));
    });
}

app.use('/api', routes)
app.use('/', routes)

module.exports = app
