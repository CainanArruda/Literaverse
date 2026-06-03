const express = require('express');
const router = express.Router();
const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}
const { readUsers, writeUsers } = require('../utils/db');
const authMiddleware = require('../middleware/auth');

// Obter Perfil do Usuário Autenticado
router.get('/profile', authMiddleware, (req, res) => {
    try {
        const users = readUsers();
        const user = users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Retorna os dados do usuário, sem a senha
        const { senha, ...userSemSenha } = user;
        res.status(200).json(userSemSenha);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao obter dados de perfil.' });
    }
});

// Atualizar Perfil do Usuário Autenticado
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { nome, nascimento, senha } = req.body;
        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === req.user.id);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = users[userIndex];

        // Atualizar campos permitidos
        if (nome) user.nome = nome;
        if (nascimento) user.nascimento = nascimento;

        // Se uma nova senha for fornecida, criptografa-a com SHA-256
        if (senha && senha.trim() !== '') {
            user.senha = hashPassword(senha);
        }

        users[userIndex] = user;
        writeUsers(users);

        // Retorna o usuário atualizado sem a senha
        const { senha: _, ...userSemSenha } = user;
        res.status(200).json({
            message: 'Perfil atualizado com sucesso.',
            user: {
                id: userSemSenha.id,
                nome: userSemSenha.nome,
                email: userSemSenha.email,
                usuario: userSemSenha.usuario
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao atualizar dados de perfil.' });
    }
});

// Excluir Conta do Usuário Autenticado
router.delete('/profile', authMiddleware, (req, res) => {
    try {
        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === req.user.id);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        users.splice(userIndex, 1);
        writeUsers(users);

        res.status(200).json({ message: 'Conta excluída com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao excluir conta.' });
    }
});

module.exports = router;
