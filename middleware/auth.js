const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Token de autenticação não fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'literaverse_super_secret_key_123_galaxy');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token de autenticação inválido ou expirado.' });
    }
};
