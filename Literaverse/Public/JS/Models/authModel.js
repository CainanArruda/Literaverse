// --- PADRÃO DE DESIGN: OBSERVER ---

/**
 * Subject/Observable no padrão Observer.
 * Permite que componentes assinem eventos de autenticação (login, logout, atualização)
 * e atualizem a interface de forma reativa.
 */
class AuthSubject {
    constructor() {
        this.observers = [];
    }

    /**
     * Inscreve uma função observadora
     * @param {Function} fn 
     */
    subscribe(fn) {
        if (typeof fn === 'function') {
            this.observers.push(fn);
        }
    }

    /**
     * Remove a inscrição de uma função
     * @param {Function} fn 
     */
    unsubscribe(fn) {
        this.observers = this.observers.filter(sub => sub !== fn);
    }

    /**
     * Notifica todos os observadores inscritos
     * @param {object} event 
     */
    notify(event) {
        console.log(`[Observer] Notificando observadores do evento: ${event.action}`);
        this.observers.forEach(fn => {
            try {
                fn(event);
            } catch (err) {
                console.error("[Observer] Erro ao disparar callback do observador:", err);
            }
        });
    }
}

// Instância global única do publicador para acesso nos controladores frontend
const authNotifier = new AuthSubject();

// --- SESSÃO E CONEXÃO COM O BACKEND API ---

/**
 * Faz login real no servidor backend.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<object>}
 */
async function simularLoginAPI(email, senha) {
    console.log(`[API] Tentando login para: ${email}`);
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro no login.');
    }
    
    // Salva o token JWT no localStorage
    localStorage.setItem('literaverse_token', data.token);
    
    // Notifica os observadores do login bem-sucedido
    authNotifier.notify({ action: 'login', user: data.user });
    
    return data.user;
}

/**
 * Faz registro real no servidor backend.
 * @param {object} novoUsuario
 * @returns {Promise<object>}
 */
async function simularRegistroAPI(novoUsuario) {
    console.log(`[API] Tentando registrar: ${novoUsuario.email}`);
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoUsuario)
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro no cadastro.');
    }
    
    // Salva o token JWT no localStorage
    localStorage.setItem('literaverse_token', data.token);
    
    // Notifica os observadores do registro bem-sucedido
    authNotifier.notify({ action: 'register', user: data.user });
    
    return data.user;
}

/**
 * Obtém os dados completos do perfil do usuário autenticado no backend.
 * @returns {Promise<object>}
 */
async function obterPerfilAPI() {
    const token = localStorage.getItem('literaverse_token');
    if (!token) {
        throw new Error('Usuário não autenticado.');
    }

    const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao carregar perfil do servidor.');
    }

    return data;
}

/**
 * Atualiza os dados de perfil do usuário autenticado no backend.
 * @param {object} dadosUsuario
 * @returns {Promise<object>}
 */
async function atualizarPerfilAPI(dadosUsuario) {
    const token = localStorage.getItem('literaverse_token');
    if (!token) {
        throw new Error('Usuário não autenticado.');
    }

    const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dadosUsuario)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar dados do perfil.');
    }

    // Notifica os observadores sobre a atualização dos dados do usuário
    authNotifier.notify({ action: 'update', user: data.user });

    return data;
}

/**
 * Exclui a conta do usuário autenticado no backend.
 * @returns {Promise<object>}
 */
async function excluirPerfilAPI() {
    const token = localStorage.getItem('literaverse_token');
    if (!token) {
        throw new Error('Usuário não autenticado.');
    }

    const response = await fetch('/api/users/profile', {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir a conta.');
    }

    // Notifica os observadores sobre a deleção de conta
    authNotifier.notify({ action: 'delete', user: null });

    return data;
}

//--- SESSÃO ---

/**
 * Salva os dados de sessão do usuário
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
 * Limpa a sessão e tokens (logout)
 */
function fazerLogout() {
    console.log("Fazendo logout...");
    localStorage.removeItem('literaverse_session');
    localStorage.removeItem('literaverse_token');
    
    // Notifica observadores do logout
    authNotifier.notify({ action: 'logout', user: null });
    
    // Redireciona para a home
    window.location.href = 'index.html';
}