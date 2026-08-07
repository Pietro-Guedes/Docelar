const pool = require('../config/database');

class EstoqueRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM estoque ORDER BY id_estoque DESC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM estoque WHERE id_estoque = ?', [id]);
        return rows[0];
    }

    async findByProduto(id_produto) {
        const [rows] = await pool.query('SELECT * FROM estoque WHERE id_produto = ? ORDER BY data_entrada DESC', [id_produto]);
        return rows;
    }

    async findByProdutoOrdenadoPorValidade(id_produto) {
        const [rows] = await pool.query(
            'SELECT * FROM estoque WHERE id_produto = ? AND quantidade > 0 ORDER BY validade ASC',
            [id_produto]
        );
        return rows;
    }

    async findVencidos() {
        const [rows] = await pool.query(
            'SELECT * FROM estoque WHERE validade < CURDATE() AND quantidade > 0'
        );
        return rows;
    }

    async findProximosVencimento(dias) {
        const [rows] = await pool.query(
            'SELECT * FROM estoque WHERE validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY) AND quantidade > 0',
            [dias]
        );
        return rows;
    }

    async create(estoqueData) {
        const { quantidade, validade, id_produto, id_fornecedor } = estoqueData;
        const [result] = await pool.query(
            'INSERT INTO estoque (quantidade, validade, id_produto, id_fornecedor) VALUES (?, ?, ?, ?)',
            [quantidade, validade, id_produto, id_fornecedor]
        );
        return result.insertId;
    }

    async update(id, estoqueData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(estoqueData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE estoque SET ${fields.join(', ')} WHERE id_estoque = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM estoque WHERE id_estoque = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new EstoqueRepository();