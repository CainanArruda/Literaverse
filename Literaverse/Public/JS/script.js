// --- Execução Principal (quando o DOM carregar) ---
document.addEventListener('DOMContentLoaded', () => {

    console.log("DOM carregado. Iniciando script principal.");

    // --- Lógica de Tema (Existente) ---
    const botaoTema = document.getElementById('alternarTema');
    const body = document.body;

    function aplicarTema(tema) {
        if (tema === 'claro') {
            body.classList.remove('tema-escuro');
            body.classList.add('tema-claro');
        } else {
            body.classList.remove('tema-claro');
            body.classList.add('tema-escuro');
        }
        try { localStorage.setItem('tema', tema); } catch (e) { /* ignore */ }
    }

    function inicializarTema() {
        const temaSalvo = localStorage.getItem('tema');
        const prefereEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        // Mudei o padrão para escuro, como na index.html
        const temaInicial = temaSalvo || (prefereEscuro ? 'escuro' : 'escuro'); 
        aplicarTema(temaInicial);
    }

    if (botaoTema) {
        inicializarTema();
        botaoTema.addEventListener('click', () => {
            const atual = body.classList.contains('tema-claro') ? 'claro' : 'escuro';
            aplicarTema(atual === 'claro' ? 'escuro' : 'claro');
        });
    }

    // --- Lógica de Mostrar/Ocultar Senha (Existente) ---
    const botoesMostrarSenha = document.querySelectorAll('.botao-mostrar-senha');
    botoesMostrarSenha.forEach(botao => {
        botao.addEventListener('click', () => {
            const targetId = botao.getAttribute('data-target');
            const campoSenha = document.getElementById(targetId);

            if (campoSenha) {
                const isPassword = campoSenha.type === 'password';
                campoSenha.type = isPassword ? 'text' : 'password';
                botao.classList.toggle('ativo', isPassword);
                botao.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
            }
        });
    });

    // --- Atualização da UI de Autenticação (Roda em todas as páginas) ---
    function atualizarHeaderAuth() {
        const sessao = getSessao();
        const containerAcoes = document.getElementById('acoes-usuario-auth-container');

        if (!containerAcoes) {
             console.warn("Container 'acoes-usuario-auth-container' não encontrado no header.");
             return;
        }

        if (sessao) {
            // Usuário logado
            // console.log("Atualizando header: Usuário LOGADO", sessao);
            containerAcoes.innerHTML = `
                <a href="escrever.html" class="botao-cadastro me-2">Publicar</a>
                <a href="usuario.html" class="botao-cadastro me-2">Meu Perfil (@${sessao.usuario || sessao.nome})</a>
                <button id="botao-logout" class="botao-acao me-2" style="border: 1px solid var(--cor-terciaria); color: var(--cor-terciaria); padding: .5rem 1rem; border-radius: 9999px; font-weight: 700;">Sair</button>
            `;
            const btnLogout = document.getElementById('botao-logout');
            if (btnLogout) {
                btnLogout.addEventListener('click', (e) => {
                    e.preventDefault();
                    fazerLogout();
                });
            }
        } else {
            // Usuário deslogado
            // console.log("Atualizando header: Usuário DESLOGADO");
            containerAcoes.innerHTML = `
                <a href="login.html" class="botao-cadastro me-2">Publicar</a>
                <a href="login.html" class="botao-cadastro me-2">Registrar/Logar</a>
            `;
            // Nota: O botão "Publicar" agora leva ao login se não estiver logado.
        }
    }
    atualizarHeaderAuth();


     
  
    // --- Lógica da Biblioteca (carrega livros da API) ---
    // A função é chamada aqui para garantir que o DOM está pronto e apenas na página da biblioteca.
    if (window.location.pathname.toLowerCase().includes('biblioteca.html')) {
        carregarLivrosDaAPI();
    }

    // --- Lógica do Modal (detalhe-livro.html) ---
    // Movido para dentro do DOMContentLoaded para garantir que os elementos existem
    const botaoCurtir = document.getElementById("curtirLivro");
    const modal = document.getElementById("model");
    const fecharModal = document.getElementById("FecharModal");

    if (botaoCurtir && modal && fecharModal) {
        botaoCurtir.onclick = function AbrirModel() {
            modal.showModal();
        }

        fecharModal.onclick = function FecharModel() {
            modal.close();
        }
    }
});

// --- Lógica da Página da Biblioteca (biblioteca.html) ---
/**
 * Busca livros populares de Machado de Assis da API Gutendex e os adiciona à página.
 */
async function carregarLivrosDaAPI() {
    const container = document.querySelector('.grid-livros');
    // Se o container não existir, significa que não estamos na página da biblioteca.
    if (!container) {
        return;
    }

    console.log("Página da biblioteca detectada. Carregando livros da API...");

    // Tenta carregar do Cache primeiro
    try {
        const cache = localStorage.getItem('literaverse_books_cache');
        const cacheTime = localStorage.getItem('literaverse_books_cache_time');
        const cacheDuration = 24 * 60 * 60 * 1000; // 24 horas de cache

        if (cache && cacheTime && (Date.now() - Number(cacheTime) < cacheDuration)) {
            console.log("Carregando livros a partir do cache local...");
            const data = JSON.parse(cache);
            renderizarLivrosDaAPI(data, container);
            return;
        }
    } catch (e) {
        console.warn("Falha ao ler cache de livros:", e);
    }

    try {
        // Busca os livros da nossa API local (com cache no servidor)
        const response = await fetch('/api/books');
        if (!response.ok) {
            throw new Error(`A resposta da API não foi OK: ${response.statusText}`);
        }
        const data = await response.json();

        // Salvar no Cache
        try {
            localStorage.setItem('literaverse_books_cache', JSON.stringify(data));
            localStorage.setItem('literaverse_books_cache_time', Date.now().toString());
            console.log("Livros salvos no cache local.");
        } catch (e) {
            console.warn("Falha ao salvar cache de livros:", e);
        }

        renderizarLivrosDaAPI(data, container);
    } catch (error) {
        console.error('Erro ao buscar ou processar livros da API:', error);
        // Fallback: Se a API falhar mas tivermos algum cache antigo, usamos ele
        const expiredCache = localStorage.getItem('literaverse_books_cache');
        if (expiredCache) {
            console.log("Falha na API. Usando cache expirado como fallback...");
            const data = JSON.parse(expiredCache);
            renderizarLivrosDaAPI(data, container);
        } else {
            container.innerHTML += '<p style="color: var(--cor-aviso); grid-column: 1 / -1;">Não foi possível carregar novos livros no momento.</p>';
        }
    }
}

function renderizarLivrosDaAPI(data, container) {
    container.innerHTML = ""; // Garante que limpa o container antes de renderizar
    data.results.forEach(book => {
        const coverUrl = book.formats['image/jpeg'];
        const authorName = book.authors.length > 0 ? book.authors[0].name : 'Autor desconhecido';

        if (coverUrl) {
            const article = document.createElement('article');
            article.className = 'cartao-livro';

            const link = document.createElement('a');
            link.href = '#';

            const img = document.createElement('img');
            img.src = coverUrl;
            img.alt = `Capa do livro ${book.title}`;
            img.className = 'imagem-livro';
            img.loading = 'lazy';

            link.appendChild(img);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'info-livro';

            const titleH3 = document.createElement('h3');
            titleH3.className = 'titulo-livro';
            titleH3.textContent = book.title;

            const authorP = document.createElement('p');
            authorP.className = 'autor-livro';
            authorP.textContent = authorName;

            infoDiv.appendChild(titleH3);
            infoDiv.appendChild(authorP);

            article.appendChild(link);
            article.appendChild(infoDiv);

            container.appendChild(article);
        }
    });
}
