const pool = require('../config/database');

class FuncionarioRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM funcionario ORDER BY id_funcionario DESC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM funcionario WHERE id_funcionario = ?', [id]);
        return rows[0];
    }

    async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM funcionario WHERE email = ?', [email]);
        return rows[0];
    }

    async create(funcionarioData) {
        const { nome, email, senha_hash } = funcionarioData;
        const [result] = await pool.query(
            'INSERT INTO funcionario (nome, email, senha_hash) VALUES (?, ?, ?)',
            [nome, email, senha_hash]
        );
        return result.insertId;
    }

    async update(id, funcionarioData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(funcionarioData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE funcionario SET ${fields.join(', ')} WHERE id_funcionario = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM funcionario WHERE id_funcionario = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new FuncionarioRepository();