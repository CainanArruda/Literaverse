const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { readUsers, writeUsers } = require('../utils/db');
const UserFactory = require('../utils/userFactory');

// Função auxiliar para hashear senha com SHA-256
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Rota de Registro (Cadastro) com persistência no SQL Server e sincronização no JSON
router.post('/register', async (req, res) => {
    try {
        const { nome, usuario, email, nascimento, senha } = req.body;

        if (!nome || !usuario || !email || !nascimento || !senha) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = usuario.trim();

        // 1. Verificar duplicidades no SQL Server
        try {
            const dup = await userRepository.findDuplicate(normalizedEmail, normalizedUsername);
            if (dup) {
                if (dup.emailExists) {
                    return res.status(400).json({ message: 'Este email já está cadastrado.' });
                }
                if (dup.usernameExists) {
                    return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
                }
            }
        } catch (sqlErr) {
            console.warn('[API Auth] Aviso ao verificar duplicidade no SQL Server, checando base local:', sqlErr.message);
            const users = readUsers();
            if (users.some((u) => u.email === normalizedEmail)) {
                return res.status(400).json({ message: 'Este email já está cadastrado.' });
            }
            if (users.some((u) => u.usuario === normalizedUsername)) {
                return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
            }
        }

        // Criptografar senha usando SHA-256
        const hashedPassword = hashPassword(senha);
        const novoUsuario = UserFactory.createUser(nome, normalizedUsername, normalizedEmail, nascimento, hashedPassword);

        // 2. Persistir no SQL Server
        try {
            await userRepository.create(novoUsuario);
        } catch (sqlErr) {
            console.warn('[API Auth] Aviso ao persistir usuário no SQL Server:', sqlErr.message);
        }

        // 3. Sincronizar no users.json para compatibilidade
        try {
            const users = readUsers();
            if (!users.some((u) => u.id === novoUsuario.id || u.email === novoUsuario.email)) {
                users.push(novoUsuario);
                writeUsers(users);
            }
        } catch (jsonErr) {
            console.warn('[API Auth] Aviso ao sincronizar users.json:', jsonErr.message);
        }

        // Gerar Token JWT
        const token = jwt.sign(
            { id: novoUsuario.id, email: novoUsuario.email },
            process.env.JWT_SECRET || 'literaverse_super_secret_key_123_galaxy',
            { expiresIn: '24h' }
        );

        return res.status(201).json({
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
        return res.status(500).json({ message: 'Erro ao registrar usuário.' });
    }
});

// Rota de Login com consulta no SQL Server e fallback no JSON
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        }

        const normalizedIdentifier = email.toLowerCase().trim();
        let usuarioEncontrado = null;

        // 1. Tenta buscar no SQL Server
        try {
            usuarioEncontrado = await userRepository.findByIdentifier(normalizedIdentifier);
        } catch (sqlErr) {
            console.warn('[API Auth] Aviso ao buscar usuário no SQL Server:', sqlErr.message);
        }

        // 2. Fallback no JSON se não encontrou no SQL Server
        if (!usuarioEncontrado) {
            const users = readUsers();
            usuarioEncontrado = users.find(
                (u) => u.email === normalizedIdentifier || u.usuario === normalizedIdentifier
            );
        }

        if (!usuarioEncontrado) {
            return res.status(400).json({ message: 'Usuário não encontrado.' });
        }

        // Comparar senha criptografada com SHA-256
        const hashedPassword = hashPassword(senha);
        const senhaCadastrada = usuarioEncontrado.senha || usuarioEncontrado.senha_leitor;

        if (senhaCadastrada !== hashedPassword) {
            return res.status(400).json({ message: 'Senha incorreta.' });
        }

        const userId = usuarioEncontrado.id || usuarioEncontrado.id_leitor;
        const userEmail = usuarioEncontrado.email || usuarioEncontrado.email_leitor;
        const userNome = usuarioEncontrado.nome || usuarioEncontrado.nome_leitor;
        const userUsuario = usuarioEncontrado.usuario || usuarioEncontrado.usuario_leitor;

        // Gerar Token JWT
        const token = jwt.sign(
            { id: userId, email: userEmail },
            process.env.JWT_SECRET || 'literaverse_super_secret_key_123_galaxy',
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            token,
            user: {
                id: userId,
                nome: userNome,
                email: userEmail,
                usuario: userUsuario
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao fazer login.' });
    }
});

module.exports = router;
