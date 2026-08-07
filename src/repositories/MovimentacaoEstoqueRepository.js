const pool = require('../config/database');

class MovimentacaoEstoqueRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM movimentacao_estoque ORDER BY id_movimentacao DESC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM movimentacao_estoque WHERE id_movimentacao = ?', [id]);
        return rows[0];
    }

    async findByProduto(id_produto) {
        const [rows] = await pool.query(
            `SELECT m.*
             FROM movimentacao_estoque m
             JOIN estoque e ON e.id_estoque = m.id_estoque
             WHERE e.id_produto = ?
             ORDER BY m.data_movimentacao DESC`,
            [id_produto]
        );
        return rows;
    }

    async create(movimentacaoData) {
        const { tipo, quantidade, valor_unitario, motivo_devolucao, observacao, id_estoque, id_funcionario } = movimentacaoData;
        const [result] = await pool.query(
            'INSERT INTO movimentacao_estoque (tipo, quantidade, valor_unitario, motivo_devolucao, observacao, id_estoque, id_funcionario) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [tipo, quantidade, valor_unitario, motivo_devolucao, observacao, id_estoque, id_funcionario]
        );
        return result.insertId;
    }

    async update(id, movimentacaoData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(movimentacaoData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE movimentacao_estoque SET ${fields.join(', ')} WHERE id_movimentacao = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM movimentacao_estoque WHERE id_movimentacao = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new MovimentacaoEstoqueRepository();