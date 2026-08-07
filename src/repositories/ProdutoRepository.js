const pool = require('../config/database');

class ProdutoRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM produto ORDER BY id_produto DESC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM produto WHERE id_produto = ?', [id]);
        return rows[0];
    }

    async create(produtoData) {
        const { nome, descricao, valor_unitario, id_categoria, id_fornecedor, id_funcionario } = produtoData;
        const [result] = await pool.query(
            'INSERT INTO produto (nome, descricao, valor_unitario, id_categoria, id_fornecedor, id_funcionario) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, descricao, valor_unitario, id_categoria, id_fornecedor, id_funcionario]
        );
        return result.insertId;
    }

    async update(id, produtoData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(produtoData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE produto SET ${fields.join(', ')} WHERE id_produto = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM produto WHERE id_produto = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new ProdutoRepository();