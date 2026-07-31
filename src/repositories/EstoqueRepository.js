const pool = require('../config/database');

class EstoqueRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM produto ORDER BY id DESC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM produto WHERE id = ?', [id]);
        return rows[0];
    }
     async create(estoqueData) {
        const { quantidade, validade, data_entrada, id_produto, id_fornecedor } = estoqueData;
        const [result] = await pool.query(
            'INSERT INTO produto (quantidade, validade, data_entrada, id_produto, id_fornecedor) VALUES (?, ?, ?, ?, ?)',
            [quantidade, validade, data_entrada, id_produto, id_fornecedor]
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
        const query = `UPDATE produto SET ${fields.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM produto WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new EstoqueRepository();