const jwt = require('jsonwebtoken');
const FuncionarioRepository = require('../repositories/FuncionarioRepository');

const verificarToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ sucesso: false, mensagem: "Token de autenticação não fornecido" });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ sucesso: false, mensagem: "Token inválido (Formato esperado: Bearer <token>)" });
    }

    const token = parts[1];

    let decodificado;
    try {
        decodificado = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
        return res.status(401).json({ sucesso: false, mensagem: "Token inválido ou expirado" });
    }

    // conta desativada perde o acesso na hora, mesmo com token ainda válido
    try {
        const funcionario = await FuncionarioRepository.findById(decodificado.id);
        if (!funcionario || Number(funcionario.ativo) === 0) {
            return res.status(401).json({ sucesso: false, mensagem: "Conta desativada ou inexistente" });
        }
    } catch (err) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao verificar o usuário" });
    }

    req.usuarioId = decodificado.id;
    req.usuario = { id: decodificado.id, nome: decodificado.nome, email: decodificado.email };
    return next();
};

// Deve vir depois de verificarToken. Consulta o banco a cada chamada, assim
// remover o admin de alguém vale na hora (sem esperar o token expirar).
const verificarAdmin = async (req, res, next) => {
    try {
        const funcionario = await FuncionarioRepository.findById(req.usuarioId);
        if (!funcionario || !funcionario.admin) {
            return res.status(403).json({ sucesso: false, mensagem: "Acesso restrito a administradores" });
        }
        return next();
    } catch (err) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao verificar permissão" });
    }
};

module.exports = {
    verificarToken,
    verificarAdmin
};

