const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
require('dotenv').config();

const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const booksRoutes = require('../routes/books');
const authorsRoutes = require('../routes/authors');
const { getPool } = require('../database/connections');

test.after(async () => {
    try {
        const pool = await getPool();
        await pool.close();
    } catch (_) {}
});

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/books', booksRoutes);
    app.use('/api/authors', authorsRoutes);
    return app;
}

test('API Backend - GET /api/books deve retornar lista paginada e metadados', async () => {
    const app = createTestApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
        const res = await fetch(`http://localhost:${port}/api/books?offset=0&limit=2`);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.ok(Array.isArray(data.results), 'results deve ser um array');
        assert.ok(data.pagination, 'objeto de paginação deve estar presente');
        assert.strictEqual(typeof data.pagination.total, 'number');
        assert.strictEqual(data.pagination.limit, 2);
        assert.strictEqual(data.pagination.offset, 0);

        if (data.results.length > 0) {
            const first = data.results[0];
            assert.ok(first.id, 'Livro deve ter id');
            assert.ok(first.titulo, 'Livro deve ter título');
        }
    } finally {
        server.close();
    }
});

test('API Backend - GET /api/authors deve retornar autores com quantidade de obras', async () => {
    const app = createTestApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
        const res = await fetch(`http://localhost:${port}/api/authors?offset=0&limit=5`);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.ok(Array.isArray(data.results));
        assert.ok(data.pagination);
        assert.ok(data.pagination.total >= 0);
    } finally {
        server.close();
    }
});

test('API Backend - GET /api/users deve retornar lista pública paginada', async () => {
    const app = createTestApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
        const res = await fetch(`http://localhost:${port}/api/users?offset=0&limit=5`);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.ok(Array.isArray(data.results));
        assert.ok(data.pagination);
    } finally {
        server.close();
    }
});

test('API Backend - Fluxo de Autenticação (Registro e Login)', async () => {
    const app = createTestApp();
    const server = app.listen(0);
    const port = server.address().port;

    const testUser = {
        nome: 'Usuario Teste QSS',
        usuario: `qss_user_${Date.now()}`,
        email: `qss_${Date.now()}@literaverse.com`,
        nascimento: '2001-01-01',
        senha: 'senhaSuperSegura123!'
    };

    try {

        const regRes = await fetch(`http://localhost:${port}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        assert.strictEqual(regRes.status, 201);
        const regData = await regRes.json();
        assert.ok(regData.token, 'Deve retornar token JWT no cadastro');
        assert.strictEqual(regData.user.email, testUser.email);

        const loginRes = await fetch(`http://localhost:${port}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                senha: testUser.senha
            })
        });
        assert.strictEqual(loginRes.status, 200);
        const loginData = await loginRes.json();
        assert.ok(loginData.token, 'Deve retornar token JWT no login');
    } finally {
        server.close();
    }
});
