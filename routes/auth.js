const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readUsers, writeUsers } = require('../utils/db');

// Rota de Registro (Cadastro)
router.post('/register', async (req, res) => {
    try {
        const { nome, usuario, email, nascimento, senha } = req.body;

        if (!nome || !usuario || !email || !nascimento || !senha) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        const users = readUsers();

        // Verificar email duplicado
        if (users.some(u => u.email === email.toLowerCase())) {
            return res.status(400).json({ message: 'Este email já está cadastrado.' });
        }

        // Verificar nome de usuário duplicado
        if (users.some(u => u.usuario === usuario)) {
            return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
        }

        // Criptografar senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);

        const novoUsuario = {
            id: 'user_' + Date.now(),
            nome,
            usuario,
            email: email.toLowerCase(),
            nascimento,
            senha: hashedPassword,
            dataCadastro: new Date().toISOString(),
            foto: "https://placehold.co/150x150/5f3f71/F4E927?text=User"
        };

        users.push(novoUsuario);
        writeUsers(users);

        // Gerar Token JWT
        const token = jwt.sign(
            { id: novoUsuario.id, email: novoUsuario.email },
            process.env.JWT_SECRET || 'literaverse_super_secret_key_123_galaxy',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: novoUsuario.id,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                usuario: novoUsuario.usuario
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao registrar usuário.' });
    }
});

// Rota de Login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        }

        const users = readUsers();
        const usuarioEncontrado = users.find(u => u.email === email.toLowerCase());

        if (!usuarioEncontrado) {
            return res.status(400).json({ message: 'Usuário não encontrado.' });
        }

        // Comparar senha criptografada
        const isMatch = await bcrypt.compare(senha, usuarioEncontrado.senha);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta.' });
        }

        // Gerar Token JWT
        const token = jwt.sign(
            { id: usuarioEncontrado.id, email: usuarioEncontrado.email },
            process.env.JWT_SECRET || 'literaverse_super_secret_key_123_galaxy',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            user: {
                id: usuarioEncontrado.id,
                nome: usuarioEncontrado.nome,
                email: usuarioEncontrado.email,
                usuario: usuarioEncontrado.usuario
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao fazer login.' });
    }
});

module.exports = router;
