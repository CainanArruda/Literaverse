const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const { readUsers, writeUsers } = require('../utils/db');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const authMiddleware = require('../middleware/auth');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Rota GET /api/users - Listagem pública paginada de leitores/usuários
router.get('/', async (req, res) => {
    const page = parsePagination(req.query);
    if (page.error) {
        return res.status(400).json({ message: page.error });
    }

    try {
        const result = await userRepository.findAllPublic(page.offset, page.limit);
        return res.json(paginatedResponse(result, page.offset, page.limit));
    } catch (err) {
        console.warn('[API Users] SQL Server indisponível, usando fallback local:', err.message);
        try {
            const allUsers = readUsers();
            const sliced = allUsers.slice(page.offset, page.offset + page.limit).map((u) => ({
                id: u.id,
                nome: u.nome,
                usuario: u.usuario,
                foto: u.foto || 'https://placehold.co/150x150/5f3f71/F4E927?text=User'
            }));
            return res.json(paginatedResponse({ items: sliced, total: allUsers.length }, page.offset, page.limit));
        } catch (fallbackErr) {
            return res.status(500).json({ message: 'Erro ao listar usuários.' });
        }
    }
});

// Obter Perfil do Usuário Autenticado
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        // Tenta obter do SQL Server primeiro
        try {
            const sqlUser = await userRepository.findById(req.user.id);
            if (sqlUser) {
                const { senha, ...userSemSenha } = sqlUser;
                return res.status(200).json(userSemSenha);
            }
        } catch (sqlErr) {
            console.warn('[API Users] Falha ao consultar perfil no SQL Server, tentando fallback JSON:', sqlErr.message);
        }

        // Fallback para users.json
        const users = readUsers();
        const user = users.find((u) => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const { senha, ...userSemSenha } = user;
        return res.status(200).json(userSemSenha);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao obter dados de perfil.' });
    }
});

// Atualizar Perfil do Usuário Autenticado (UPDATE no SQL Server e sincronização no JSON)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { nome, nascimento, senha } = req.body;
        const updates = {};

        if (nome) updates.nome = nome;
        if (nascimento) updates.nascimento = nascimento;
        if (senha && senha.trim() !== '') {
            updates.senha = hashPassword(senha);
        }

        let updatedUser = null;

        // Atualização no SQL Server
        try {
            updatedUser = await userRepository.update(req.user.id, updates);
        } catch (sqlErr) {
            console.warn('[API Users] Aviso ao atualizar usuário no SQL Server:', sqlErr.message);
        }

        // Sincronização no users.json
        try {
            const users = readUsers();
            const userIndex = users.findIndex((u) => u.id === req.user.id);

            if (userIndex !== -1) {
                const user = users[userIndex];
                if (nome) user.nome = nome;
                if (nascimento) user.nascimento = nascimento;
                if (updates.senha) user.senha = updates.senha;

                users[userIndex] = user;
                writeUsers(users);

                if (!updatedUser) {
                    updatedUser = user;
                }
            }
        } catch (jsonErr) {
            console.warn('[API Users] Aviso ao sincronizar users.json:', jsonErr.message);
        }

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        return res.status(200).json({
            message: 'Perfil atualizado com sucesso.',
            user: {
                id: updatedUser.id,
                nome: updatedUser.nome,
                email: updatedUser.email,
                usuario: updatedUser.usuario
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar dados de perfil.' });
    }
});

// Excluir Conta do Usuário Autenticado (DELETE no SQL Server e no JSON)
router.delete('/profile', authMiddleware, async (req, res) => {
    try {
        let deletedFromSql = false;

        // Exclusão no SQL Server
        try {
            await userRepository.remove(req.user.id);
            deletedFromSql = true;
        } catch (sqlErr) {
            console.warn('[API Users] Aviso ao excluir usuário do SQL Server:', sqlErr.message);
        }

        // Exclusão no users.json
        const users = readUsers();
        const userIndex = users.findIndex((u) => u.id === req.user.id);

        if (userIndex !== -1) {
            users.splice(userIndex, 1);
            writeUsers(users);
        } else if (!deletedFromSql) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        return res.status(200).json({ message: 'Conta excluída com sucesso.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao excluir conta.' });
    }
});

module.exports = router;
