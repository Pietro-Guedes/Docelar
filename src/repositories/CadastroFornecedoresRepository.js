const pool = require('../config/database');

class CadastroFornecedoresRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM produto ORDER BY id DESC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM produto WHERE id = ?', [id]);
        return rows[0];
    }
     async create(cadastrofornecedoresData) {
        const { nome, cnpj, telefone, email} = cadastrofornecedoresData;
        const [result] = await pool.query(
            'INSERT INTO produto (nome, cnpj, telefone, email) VALUES (?, ?, ?, ?)',
            [nome, cnpj, telefone, email]
        );
        return result.insertId;
    }


    async update(id, cadastrofornecedoresData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(cadastrofornecedoresData)) {
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

module.exports = new CadastroFornecedoresRepository();