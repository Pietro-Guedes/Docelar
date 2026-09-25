const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ sucesso: false, mensagem: "Token não informado" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // req.usuario passa a existir em todas as rotas protegidas por este middleware
        req.usuario = { id: payload.id, nome: payload.nome, email: payload.email };
        next();
    } catch (erro) {
        return res.status(401).json({ sucesso: false, mensagem: "Token inválido ou expirado" });
    }
}

module.exports = autenticar;
