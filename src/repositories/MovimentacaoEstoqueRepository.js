const pool = require('../config/database');

class MovimentacaoEstoqueRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM movimentacao_estoque ORDER BY id_movimentacao DESC');
        return rows;
    }

    async findById(id, executor = pool) {
        const [rows] = await executor.query('SELECT * FROM movimentacao_estoque WHERE id_movimentacao = ?', [id]);
        return rows[0];
    }

    async findByIdParaAtualizar(id, executor) {
        const [rows] = await executor.query('SELECT * FROM movimentacao_estoque WHERE id_movimentacao = ? FOR UPDATE', [id]);
        return rows[0];
    }

    async findByGrupoTroca(grupo, executor) {
        const [rows] = await executor.query(
            'SELECT * FROM movimentacao_estoque WHERE observacao LIKE ? ORDER BY id_movimentacao FOR UPDATE',
            [`%GRUPO_TROCA:${grupo}%`]
        );
        return rows;
    }

    async findEstorno(id_movimentacao, executor) {
        const [rows] = await executor.query(
            'SELECT id_movimentacao FROM movimentacao_estoque WHERE observacao LIKE ? LIMIT 1',
            [`%ESTORNO_MOVIMENTACAO:${id_movimentacao} ·%`]
        );
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

    async create(movimentacaoData, executor = pool) {
        const { tipo, quantidade, valor_unitario, motivo_devolucao, observacao, id_estoque, id_funcionario, id_entregador = null } = movimentacaoData;
        const [result] = await executor.query(
            'INSERT INTO movimentacao_estoque (tipo, quantidade, valor_unitario, motivo_devolucao, observacao, id_estoque, id_funcionario, id_entregador) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [tipo, quantidade, valor_unitario, motivo_devolucao, observacao, id_estoque, id_funcionario, id_entregador]
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