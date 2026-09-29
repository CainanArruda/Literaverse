class AuthSubject {
    constructor() {
        this.observers = [];
    }

    subscribe(fn) {
        if (typeof fn === 'function') {
            this.observers.push(fn);
        }
    }

    unsubscribe(fn) {
        this.observers = this.observers.filter(sub => sub !== fn);
    }

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

const authNotifier = new AuthSubject();

const OBTER_API_URL = (endpoint) => {
    const usarUrlAbsoluta = (window.location.port && window.location.port !== '3000') || window.location.protocol === 'file:';
    const baseUrl = usarUrlAbsoluta ? 'http://localhost:3000' : '';
    return `${baseUrl}${endpoint}`;
};

async function simularLoginAPI(email, senha) {
    console.log(`[API] Tentando login para: ${email}`);
    const response = await fetch(OBTER_API_URL('/api/auth/login'), {
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

    localStorage.setItem('literaverse_token', data.token);

    authNotifier.notify({ action: 'login', user: data.user });

    return data.user;
}

async function simularRegistroAPI(novoUsuario) {
    console.log(`[API] Tentando registrar: ${novoUsuario.email}`);
    const response = await fetch(OBTER_API_URL('/api/auth/register'), {
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

    localStorage.setItem('literaverse_token', data.token);

    authNotifier.notify({ action: 'register', user: data.user });

    return data.user;
}

async function obterPerfilAPI() {
    const token = localStorage.getItem('literaverse_token');
    if (!token) {
        throw new Error('Usuário não autenticado.');
    }

    const response = await fetch(OBTER_API_URL('/api/users/profile'), {
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

async function atualizarPerfilAPI(dadosUsuario) {
    const token = localStorage.getItem('literaverse_token');
    if (!token) {
        throw new Error('Usuário não autenticado.');
    }

    const response = await fetch(OBTER_API_URL('/api/users/profile'), {
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

    authNotifier.notify({ action: 'update', user: data.user });

    return data;
}

async function excluirPerfilAPI() {
    const token = localStorage.getItem('literaverse_token');
    if (!token) {
        throw new Error('Usuário não autenticado.');
    }

    const response = await fetch(OBTER_API_URL('/api/users/profile'), {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir a conta.');
    }

    authNotifier.notify({ action: 'delete', user: null });

    return data;
}

function salvarSessao(sessaoUsuario) {
    try {
        localStorage.setItem('literaverse_session', JSON.stringify(sessaoUsuario));
        console.log("Sessão salva:", sessaoUsuario);
    } catch (e) {
        console.error("Erro ao salvar sessão", e);
    }
}

function getSessao() {
    try {
        const sessao = localStorage.getItem('literaverse_session');
        return sessao ? JSON.parse(sessao) : null;
    } catch (e) {
        console.error("Erro ao ler sessão", e);
        return null;
    }
}

function fazerLogout() {
    console.log("Fazendo logout...");
    localStorage.removeItem('literaverse_session');
    localStorage.removeItem('literaverse_token');

    authNotifier.notify({ action: 'logout', user: null });

    window.location.href = 'index.html';
}
