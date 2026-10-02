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

// Fotos dos produtos
const pastaUploads = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(pastaUploads));
app.use('/api/uploads', express.static(pastaUploads));

// ---------------------------------------------------------------- site (front-end)
// Depois de "npm run build", o front fica em frontend/dist e o próprio back entrega o site.
// Assim tudo roda num endereço só: http://localhost:3000
const pastaSite = path.join(__dirname, '..', 'frontend', 'dist');
const siteCompilado = fs.existsSync(path.join(pastaSite, 'index.html'));

if (siteCompilado) {
    app.use(express.static(pastaSite, { index: false }));

    // Quando o navegador abre uma página do site (ex.: /inventario ou /produtos/4),
    // entrega o index.html e o React mostra a tela certa.
    // Chamadas da API pedem JSON, então continuam indo para as rotas abaixo.
    app.use((req, res, next) => {
        const ehPaginaDoSite = req.method === 'GET'
            && !req.path.startsWith('/api')
            && !req.path.startsWith('/uploads')
            && req.accepts(['json', 'html']) === 'html';
        if (!ehPaginaDoSite) return next();
        res.sendFile(path.join(pastaSite, 'index.html'));
    });
}

// ---------------------------------------------------------------- API
// O front usa /api/...; as rotas antigas (sem /api) continuam funcionando.
app.use('/api', routes)
app.use('/', routes)

module.exports = app
