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
    
    // Inscreve a atualização de UI do header como observadora no publicador (Observer)
    if (typeof authNotifier !== 'undefined') {
        authNotifier.subscribe((event) => {
            console.log("[Observer UI] Recebido evento no header:", event);
            // Reage ao evento correspondente
            if (event.user) {
                salvarSessao(event.user);
            }
            atualizarHeaderAuth();
        });
    }


     
  
    // --- Lógica da Biblioteca (carrega livros da API) ---
    const pathLower = window.location.pathname.toLowerCase();
    const isBiblioteca = pathLower.includes('biblioteca') || 
                         (document.querySelector('.grid-livros') && !document.querySelector('.titulo-heroi'));
    
    if (isBiblioteca) {
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
 * Busca livros da API local (que faz proxy/cache do Gutendex) e os adiciona à página.
 */
async function carregarLivrosDaAPI() {
    const container = document.querySelector('.grid-livros');
    if (!container) {
        return;
    }

    console.log("Página da biblioteca detectada. Carregando livros da API...");

    // 1. Mostrar o cache local instantaneamente (Stale-While-Revalidate)
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

    // 2. Se não tinha cache, mostra a lista estática local instantaneamente
    if (!temCacheInicial && typeof livros !== 'undefined' && Array.isArray(livros)) {
        console.log("[SWR] Renderizando livros locais como fallback inicial.");
        renderizarLivrosDaAPI(livros, container);
    }

    // 3. Busca livros atualizados do servidor de forma assíncrona
    try {
        const response = await fetch('/api/books');
        if (!response.ok) {
            throw new Error(`A resposta da API não foi OK: ${response.statusText}`);
        }
        const data = await response.json();

        // Salva o novo resultado no cache local para futuras cargas instantâneas
        try {
            localStorage.setItem('literaverse_books_cache', JSON.stringify(data));
        } catch (e) {
            console.warn("Falha ao atualizar o cache local:", e);
        }

        // Atualiza a interface com os dados frescos
        renderizarLivrosDaAPI(data, container);
    } catch (error) {
        console.error('Erro ao buscar livros atualizados:', error);
        // Se a tela estiver totalmente vazia (nem cache nem estático carregaram), exibe o erro
        if (container.children.length === 0) {
            container.innerHTML = '<p style="color: var(--cor-amarela); grid-column: 1 / -1; font-weight: 500; text-align: center; margin-top: 2rem;">Não foi possível carregar os livros no momento. Por favor, tente novamente mais tarde.</p>';
        }
    }
}

function renderizarLivrosDaAPI(data, container) {
    if (!container) return;
    container.innerHTML = ""; // Limpa o container antes de renderizar

    if (!data) {
        container.innerHTML = '<p style="color: var(--cor-amarela); grid-column: 1 / -1; font-weight: 500; text-align: center; margin-top: 2rem;">Nenhum livro disponível no momento.</p>';
        return;
    }

    // Suporta tanto o formato Gutendex { results: [...] } quanto formato array direto [...]
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

            // Criar link
            const link = document.createElement('a');
            link.href = 'detalhe-livro.html';
            link.style.textDecoration = 'none';
            link.style.color = 'inherit';
            link.style.position = 'relative';

            // Criar imagem
            const img = document.createElement('img');
            img.src = coverUrl;
            img.alt = `Capa do livro ${title}`;
            img.className = 'imagem-livro';
            img.loading = 'lazy';

            // Criar info-hover (Premium overlay de slide-up)
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

            // Criar info-livro (título e autor abaixo da capa)
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
