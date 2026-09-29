class UserFactory {

    static createUser(nome, usuario, email, nascimento, hashedPassword) {
        return {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11),
            nome: nome.trim(),
            usuario: usuario.trim(),
            email: email.toLowerCase().trim(),
            nascimento: nascimento,
            senha: hashedPassword,
            dataCadastro: new Date().toISOString(),
            foto: "https://placehold.co/150x150/5f3f71/F4E927?text=User"
        };
    }
}

module.exports = UserFactory;
