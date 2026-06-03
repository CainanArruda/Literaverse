// --- BANCO DE DADOS (localStorage) ---

function getUsuariosDB() {
    try {
        const users = localStorage.getItem('literaverse_users');
        return users ? JSON.parse(users) : [];
    } catch (e) {
        console.error("Erro ao ler usuários do localStorage", e);
        return [];
    }
}



function setUsuariosDB(users) {
    try {
        localStorage.setItem('literaverse_users', JSON.stringify(users));
    } catch (e) {
        console.error("Erro ao salvar usuários no localStorage", e);
    }
}

/**
 * Salva a lista de usuários no localStorage.
 * @param {Array<object>} users
 */






// --- Simulação de API (Autenticação) ---

/**
 * Simula uma chamada de API de login (como um fetch).
 * Retorna uma Promise que resolve com dados do usuário se for sucesso,
 * ou rejeita com uma mensagem de erro.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<object>}
 */
function simularLoginAPI(email, senha) {
    console.log(`[API] Tentando login para: ${email}`);
    return new Promise((resolve, reject) => {
        // Simula a demora da rede (como o fetch faria)
        setTimeout(() => {
            const usuarios = getUsuariosDB();
            const usuarioEncontrado = usuarios.find(u => u.email === email);

            // (Nota: Em um app real, a senha seria comparada com hash no backend)
            if (usuarioEncontrado && usuarioEncontrado.senha === senha) {
                console.log("[API] Login bem-sucedido.");
                // Remove a senha antes de retornar os dados da sessão
                const sessaoUsuario = {
                    id: usuarioEncontrado.id,
                    nome: usuarioEncontrado.nome,
                    email: usuarioEncontrado.email,
                    usuario: usuarioEncontrado.usuario // Adiciona o nome de usuário à sessão
                };
                resolve(sessaoUsuario);
            } else if (usuarioEncontrado) {
                console.warn("[API] Senha incorreta.");
                reject(new Error('Senha incorreta.'));
            } else {
                console.warn("[API] Usuário não encontrado.");
                reject(new Error('Usuário não encontrado.'));
            }
        }, 800); // 800ms de delay
    });
}



/**
 * Simula uma chamada de API de Registro (como um fetch).
 * @param {object} novoUsuario
 * @returns {Promise<object>}
 */
function simularRegistroAPI(novoUsuario) {
    console.log(`[API] Tentando registrar: ${novoUsuario.email}`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const usuarios = getUsuariosDB();
            if (usuarios.find(u => u.email === novoUsuario.email.toLowerCase())) {
                console.warn("[API] Email já existe.");
                reject(new Error('Este email já está cadastrado.'));
                return;
            }
            if (usuarios.find(u => u.usuario === novoUsuario.usuario)) {
                console.warn("[API] Nome de usuário já existe.");
                reject(new Error('Este nome de usuário já está em uso.'));
                return;
            }

            // (Em app real, a senha seria "hasheada" aqui antes de salvar)
            // Dentro de simularRegistroAPI, altere o objeto usuarioSalvo:
            const usuarioSalvo = {
                id: 'user_' + Date.now(),
                nome: novoUsuario.nome,
                usuario: novoUsuario.usuario,
                email: novoUsuario.email.toLowerCase(),
                nascimento: novoUsuario.nascimento,
                senha: novoUsuario.senha,
                dataCadastro: new Date().toISOString(),
                foto: "https://placehold.co/150x150/5f3f71/F4E927?text=User" // Foto padrão inicial
            };

            usuarios.push(usuarioSalvo);
            setUsuariosDB(usuarios);
            console.log("[API] Registro bem-sucedido.");

            // Retorna os dados da sessão (sem a senha)
            const sessaoUsuario = {
                id: usuarioSalvo.id,
                nome: usuarioSalvo.nome,
                email: usuarioSalvo.email,
                usuario: usuarioSalvo.usuario
            };
            resolve(sessaoUsuario);

        }, 800);
    });
}



//--- SESSÃO ---

/**
 * Salva a sessão do usuário no localStorage (simulando um token JWT)
 * @param {object} sessaoUsuario
 */
function salvarSessao(sessaoUsuario) {
    try {
        localStorage.setItem('literaverse_session', JSON.stringify(sessaoUsuario));
        console.log("Sessão salva:", sessaoUsuario);
    } catch (e) {
        console.error("Erro ao salvar sessão", e);
    }
}


/**
 * Recupera a sessão do usuário
 * @returns {object | null}
 */
function getSessao() {
    try {
        const sessao = localStorage.getItem('literaverse_session');
        return sessao ? JSON.parse(sessao) : null;
    } catch (e) {
        console.error("Erro ao ler sessão", e);
        return null;
    }
}



/**
 * Limpa a sessão (logout)
 */
function fazerLogout() {
    console.log("Fazendo logout...");
    localStorage.removeItem('literaverse_session');
    // Redireciona para a home
    window.location.href = 'index.html';
}