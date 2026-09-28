const { sql, getPool } = require('../utils/db');

const USER_SELECT = `
    SELECT id_leitor AS id,
           nome_leitor AS nome,
           usuario_leitor AS usuario,
           email_leitor AS email,
           senha_leitor AS senha,
           data_nascimento AS nascimento,
           data_cadastro AS dataCadastro,
           foto_perfil AS foto
    FROM Leitor`;

async function findAllPublic(offset = 0, limit = 10) {
    const pool = await getPool();
    const result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(`
            SELECT COUNT(1) AS total FROM Leitor;
            SELECT id_leitor AS id,
                   nome_leitor AS nome,
                   usuario_leitor AS usuario,
                   foto_perfil AS foto
            FROM Leitor
            ORDER BY nome_leitor, usuario_leitor, id_leitor
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

    return { items: result.recordsets[1], total: result.recordsets[0][0].total };
}

async function findDuplicate(email, username) {
    const pool = await getPool();
    const result = await pool.request()
        .input('email', sql.VarChar(100), email)
        .input('username', sql.VarChar(50), username)
        .query(`
            SELECT
                CASE WHEN EXISTS (SELECT 1 FROM Leitor WHERE email_leitor = @email) THEN 1 ELSE 0 END AS emailExists,
                CASE WHEN EXISTS (SELECT 1 FROM Leitor WHERE usuario_leitor = @username) THEN 1 ELSE 0 END AS usernameExists
        `);

    return result.recordset[0];
}

async function findByIdentifier(identifier) {
    const pool = await getPool();
    const result = await pool.request()
        .input('identifier', sql.VarChar(100), identifier)
        .query(`${USER_SELECT} WHERE email_leitor = @identifier OR usuario_leitor = @identifier`);

    return result.recordset[0] || null;
}

async function findById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.VarChar(50), id)
        .query(`${USER_SELECT} WHERE id_leitor = @id`);

    return result.recordset[0] || null;
}

async function create(user) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.VarChar(50), user.id)
        .input('name', sql.VarChar(100), user.nome)
        .input('username', sql.VarChar(50), user.usuario)
        .input('email', sql.VarChar(100), user.email)
        .input('password', sql.VarChar(255), user.senha)
        .input('birthDate', sql.Date, user.nascimento)
        .input('createdAt', sql.DateTime, new Date(user.dataCadastro))
        .input('photo', sql.VarChar(500), user.foto)
        .query(`
            INSERT INTO Leitor (id_leitor, nome_leitor, usuario_leitor, email_leitor, senha_leitor, data_nascimento, data_cadastro, foto_perfil)
            VALUES (@id, @name, @username, @email, @password, @birthDate, @createdAt, @photo);
            ${USER_SELECT} WHERE id_leitor = @id;
        `);

    return result.recordsets[0][0];
}

async function update(id, fields) {
    const pool = await getPool();
    const request = pool.request().input('id', sql.VarChar(50), id);
    const updates = [];

    if (fields.nome) {
        request.input('name', sql.VarChar(100), fields.nome);
        updates.push('nome_leitor = @name');
    }

    if (fields.nascimento) {
        request.input('birthDate', sql.Date, fields.nascimento);
        updates.push('data_nascimento = @birthDate');
    }

    if (fields.senha) {
        request.input('password', sql.VarChar(255), fields.senha);
        updates.push('senha_leitor = @password');
    }

    if (updates.length) {
        await request.query(`UPDATE Leitor SET ${updates.join(', ')} WHERE id_leitor = @id`);
    }

    return findById(id);
}

async function remove(id) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const request = new sql.Request(transaction).input('id', sql.VarChar(50), id);
        await request.query('DELETE FROM Ler WHERE id_leitor = @id; DELETE FROM Leitor WHERE id_leitor = @id;');
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports = { findAllPublic, findDuplicate, findByIdentifier, findById, create, update, remove };