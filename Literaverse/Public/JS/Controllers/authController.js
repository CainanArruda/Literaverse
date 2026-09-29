document.addEventListener('DOMContentLoaded', () => {

    function protegerPagina() {
        const sessao = getSessao();

        if (document.body.classList.contains('pagina-protegida')) {
            console.log("Verificando proteção de página...");
            if (!sessao) {
                console.warn("Acesso negado. Usuário não logado. Redirecionando para login...");

                localStorage.setItem('redirect_after_login', window.location.pathname + window.location.search);
                window.location.href = 'login.html';
            } else {
                console.log("Acesso permitido.");

                if (document.body.classList.contains('pagina-usuario')) {
                    carregarDadosUsuario(sessao);
                }
            }
        }
    }
    protegerPagina();
});
