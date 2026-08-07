const db = require('../config/database'); // sua conexão mysql2

class ImagemRepository {
    async findByProduto(id_produto) {
        const [rows] = await db.query('SELECT * FROM imagem WHERE id_produto = ?', [id_produto]);
        return rows;
    }

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM imagem WHERE id = ?', [id]);
        return rows[0];
    }

    async create(dados) {
        const [result] = await db.query(
            'INSERT INTO imagem (link, id_produto) VALUES (?, ?)',
            [dados.link, dados.id_produto]
        );
        return result.insertId;
    }

    async delete(id) {
        await db.query('DELETE FROM imagem WHERE id = ?', [id]);
    }
}

module.exports = new ImagemRepository();