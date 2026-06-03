document.addEventListener('DOMContentLoaded', () => {
    // --- Proteção de Páginas (Roda em páginas específicas) ---
    function protegerPagina() {
        const sessao = getSessao();
        // Se o body tiver uma classe específica, verificamos
        if (document.body.classList.contains('pagina-protegida')) {
            console.log("Verificando proteção de página...");
            if (!sessao) {
                console.warn("Acesso negado. Usuário não logado. Redirecionando para login...");
                // Se não está logado, redireciona para o login
                // Salva a página atual para redirecionar de volta após o login
                localStorage.setItem('redirect_after_login', window.location.pathname + window.location.search);
                window.location.href = 'login.html';
            } else {
                console.log("Acesso permitido.");
                // Se está logado, podemos carregar os dados do usuário
                // (Ex: em usuario.html, carregar os dados da sessão)
                if (document.body.classList.contains('pagina-usuario')) {
                    carregarDadosUsuario(sessao);
                }
            }
        }
    }
    protegerPagina();
});
