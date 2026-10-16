const pool = require('../config/database');

class CadastroFornecedoresRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM fornecedor ORDER BY id_fornecedor DESC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM fornecedor WHERE id_fornecedor = ?', [id]);
        return rows[0];
    }

    async findByCnpj(cnpj) {
        const [rows] = await pool.query('SELECT * FROM fornecedor WHERE cnpj = ?', [cnpj]);
        return rows[0];
    }

    async create(fornecedorData) {
        const { nome, cnpj, telefone, email } = fornecedorData;
        const [result] = await pool.query(
            'INSERT INTO fornecedor (nome, cnpj, telefone, email) VALUES (?, ?, ?, ?)',
            [nome, cnpj, telefone, email]
        );
        return result.insertId;
    }

    async update(id, fornecedorData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(fornecedorData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE fornecedor SET ${fields.join(', ')} WHERE id_fornecedor = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async contarVinculos(id) {
        const [[r0]] = await pool.query('SELECT COUNT(*) AS total FROM produto WHERE id_fornecedor = ?', [id]);
        const [[r1]] = await pool.query('SELECT COUNT(*) AS total FROM estoque WHERE id_fornecedor = ?', [id]);
        return Number(r0.total) + Number(r1.total);
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM fornecedor WHERE id_fornecedor = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new CadastroFornecedoresRepository();