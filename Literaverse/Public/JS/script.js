document.addEventListener('DOMContentLoaded', () => {

    console.log("DOM carregado. Iniciando script principal.");

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
        try { localStorage.setItem('tema', tema); } catch (e) {  }
    }

    function inicializarTema() {
        const temaSalvo = localStorage.getItem('tema');
        const prefereEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

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

    function atualizarHeaderAuth() {
        const sessao = getSessao();
        const containerAcoes = document.getElementById('acoes-usuario-auth-container');

        if (!containerAcoes) {
             console.warn("Container 'acoes-usuario-auth-container' não encontrado no header.");
             return;
        }

        if (sessao) {

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

            containerAcoes.innerHTML = `
                <a href="login.html" class="botao-cadastro me-2">Publicar</a>
                <a href="login.html" class="botao-cadastro me-2">Registrar/Logar</a>
            `;

        }
    }
    atualizarHeaderAuth();

    if (typeof authNotifier !== 'undefined') {
        authNotifier.subscribe((event) => {
            console.log("[Observer UI] Recebido evento no header:", event);

            if (event.user) {
                salvarSessao(event.user);
            }
            atualizarHeaderAuth();
        });
    }

    const pathLower = window.location.pathname.toLowerCase();
    const isBiblioteca = pathLower.includes('biblioteca') ||
                         (document.querySelector('.grid-livros') && !document.querySelector('.titulo-heroi'));

    if (isBiblioteca) {
        carregarLivrosDaAPI();
    }

    const botaoCurtir = document.getElementById("curtirLivro");
    const modal = document.getElementById("model");
    const fecharModal = document.getElementById("FecharModal");

    if (botaoCurtir && modal && fecharModal) {
        botaoCurtir.onclick = function AbrirModel() {
            const sessao = typeof getSessao === 'function' ? getSessao() : null;
            if (sessao) {

                const icone = botaoCurtir.querySelector('i');
                const jaCurtido = botaoCurtir.getAttribute('aria-pressed') === 'true';

                if (jaCurtido) {
                    botaoCurtir.setAttribute('aria-pressed', 'false');
                    if (icone) icone.className = 'bx bx-heart';
                    botaoCurtir.style.color = '';
                    botaoCurtir.style.borderColor = '';
                } else {
                    botaoCurtir.setAttribute('aria-pressed', 'true');
                    if (icone) icone.className = 'bx bxs-heart';
                    botaoCurtir.style.color = 'var(--cor-terciaria)';
                    botaoCurtir.style.borderColor = 'var(--cor-terciaria)';
                }
            } else {

                modal.showModal();
            }
        }

        fecharModal.onclick = function FecharModel() {
            modal.close();
        }
    }
});

async function carregarLivrosDaAPI() {
    const container = document.querySelector('.grid-livros');
    if (!container) {
        return;
    }

    console.log("Página da biblioteca detectada. Carregando livros da API...");

    let temCacheInicial = false;
    try {
        const cache = localStorage.getItem('literaverse_books_cache');
        if (cache) {
            const data = JSON.parse(cache);
            if (data && (Array.isArray(data) || Array.isArray(data.results))) {
                console.log("[SWR] Carregando livros do cache do navegador instantaneamente.");
                renderizarLivrosDaAPI(data, container);
                temCacheInicial = true;
            }
        }
    } catch (e) {
        console.warn("[SWR] Falha ao carregar cache do local storage:", e);
    }

    if (!temCacheInicial && typeof livros !== 'undefined' && Array.isArray(livros)) {
        console.log("[SWR] Renderizando livros locais como fallback inicial.");
        renderizarLivrosDaAPI(livros, container);
    }

    try {
        const usarUrlAbsoluta = (window.location.port && window.location.port !== '3000') || window.location.protocol === 'file:';
        const baseUrl = usarUrlAbsoluta ? 'http://localhost:3000' : '';
        const response = await fetch(`${baseUrl}/api/books`);
        if (!response.ok) {
            throw new Error(`A resposta da API não foi OK: ${response.statusText}`);
        }
        const data = await response.json();

        try {
            localStorage.setItem('literaverse_books_cache', JSON.stringify(data));
        } catch (e) {
            console.warn("Falha ao atualizar o cache local:", e);
        }

        renderizarLivrosDaAPI(data, container);
    } catch (error) {
        console.error('Erro ao buscar livros atualizados:', error);

        if (container.children.length === 0) {
            container.innerHTML = '<p style="color: var(--cor-amarela); grid-column: 1 / -1; font-weight: 500; text-align: center; margin-top: 2rem;">Não foi possível carregar os livros no momento. Por favor, tente novamente mais tarde.</p>';
        }
    }
}

function renderizarLivrosDaAPI(data, container) {
    if (!container) return;
    container.innerHTML = "";

    if (!data) {
        container.innerHTML = '<p style="color: var(--cor-amarela); grid-column: 1 / -1; font-weight: 500; text-align: center; margin-top: 2rem;">Nenhum livro disponível no momento.</p>';
        return;
    }

    const booksList = Array.isArray(data) ? data : (data.results && Array.isArray(data.results) ? data.results : []);

    if (booksList.length === 0) {
        container.innerHTML = '<p style="color: var(--cor-amarela); grid-column: 1 / -1; font-weight: 500; text-align: center; margin-top: 2rem;">Nenhum livro disponível no momento.</p>';
        return;
    }

    booksList.forEach(book => {
        const coverUrl = book.imagem || (book.formats && book.formats['image/jpeg']) || null;
        const authorName = book.autor || (book.authors && book.authors.length > 0 ? book.authors[0].name : 'Autor desconhecido');
        const title = book.titulo || book.title || 'Sem título';

        if (coverUrl) {
            const article = document.createElement('article');
            article.className = 'cartao-livro';

            const link = document.createElement('a');
            link.href = 'detalhe-livro.html';
            link.style.textDecoration = 'none';
            link.style.color = 'inherit';
            link.style.position = 'relative';

            const img = document.createElement('img');
            img.src = coverUrl;
            img.alt = `Capa do livro ${title}`;
            img.className = 'imagem-livro';
            img.loading = 'lazy';

            const infoHover = document.createElement('div');
            infoHover.className = 'info-hover';

            const hoverTitle = document.createElement('h4');
            hoverTitle.className = 'fonte-titulo';
            hoverTitle.style.fontSize = '1.15rem';
            hoverTitle.style.marginBottom = '0.35rem';
            hoverTitle.textContent = title;

            const hoverAuthor = document.createElement('p');
            hoverAuthor.style.fontSize = '0.85rem';
            hoverAuthor.style.opacity = '0.85';
            hoverAuthor.style.margin = '0';
            hoverAuthor.textContent = authorName;

            const hoverTag = document.createElement('span');
            hoverTag.style.fontSize = '0.72rem';
            hoverTag.style.color = 'var(--cor-amarela)';
            hoverTag.style.marginTop = '0.5rem';
            hoverTag.style.fontWeight = '600';
            hoverTag.textContent = 'Obras Clássicas';

            infoHover.appendChild(hoverTitle);
            infoHover.appendChild(hoverAuthor);
            infoHover.appendChild(hoverTag);

            link.appendChild(img);
            link.appendChild(infoHover);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'info-livro';

            const titleH3 = document.createElement('h3');
            titleH3.className = 'titulo-livro';
            titleH3.textContent = title;

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
