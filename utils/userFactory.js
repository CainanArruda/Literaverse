/**
 * Padrão Design: Factory
 * Responsável por criar e formatar novos objetos de usuário com valores padrão da plataforma.
 */
class UserFactory {
    /**
     * Instancia um objeto usuário de forma estruturada.
     * @param {string} nome 
     * @param {string} usuario 
     * @param {string} email 
     * @param {string} nascimento 
     * @param {string} hashedPassword 
     * @returns {object}
     */
    static createUser(nome, usuario, email, nascimento, hashedPassword) {
        return {
            id: 'user_' + Date.now(),
            nome: nome.trim(),
            usuario: usuario.trim(),
            email: email.toLowerCase().trim(),
            nascimento: nascimento,
            senha: hashedPassword,
            dataCadastro: new Date().toISOString(),
            foto: "https://placehold.co/150x150/5f3f71/F4E927?text=User" // Foto padrão padrão
        };
    }
}

module.exports = UserFactory;
