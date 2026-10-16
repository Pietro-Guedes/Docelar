const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ sucesso: false, mensagem: "Token de autenticação não fornecido" });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ sucesso: false, mensagem: "Token inválido (Formato esperado: Bearer <token>)" });
    }

    const token = parts[1];

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        req.usuarioId = decodificado.id;
        req.usuario = { id: decodificado.id, nome: decodificado.nome, email: decodificado.email }
        return next();
    } catch (err) {
        return res.status(401).json({ sucesso: false, mensagem: "Token inválido ou expirado" });
    }
};

module.exports = {
    verificarToken
};

