document.addEventListener("DOMContentLoaded", () => {
  console.log("Login carregado");
});

    const formLogin = document.getElementById('formulario-login');
    if(formLogin) {
        console.log("Página de login detectada.");
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Formulário de login enviado.");

            const email = document.getElementById('email');
            const senha = document.getElementById('senha');
            const erroEl = document.getElementById('erro-formulario-login');
            const botao = document.getElementById('botao-enviar-login');

            if (erroEl) erroEl.textContent = '';
            if (botao) { botao.disabled = true; botao.textContent = 'Entrando...'; }

            simularLoginAPI(email.value.toLowerCase(), senha.value)
                .then(sessaoUsuario => {

                    console.log("Login bem-sucedido, salvando sessão...");
                    salvarSessao(sessaoUsuario);

                    const isPaginaLogin = window.location.pathname.endsWith('login.html');
                    if (isPaginaLogin) {
                        const redirectUrl = localStorage.getItem('redirect_after_login');
                        if (redirectUrl) {
                            localStorage.removeItem('redirect_after_login');
                            console.log("Redirecionando para:", redirectUrl);
                            window.location.href = redirectUrl;
                        } else {
                            console.log("Redirecionando para usuario.html");
                            window.location.href = 'usuario.html';
                        }
                    } else {

                        console.log("Login por modal bem-sucedido, recarregando página atual...");
                        window.location.reload();
                    }
                })
                .catch(erro => {

                    console.error("Falha no login:", erro.message);
                    if (erroEl) erroEl.textContent = erro.message;
                    if (botao) { botao.disabled = false; botao.textContent = 'Entrar'; }
                });
        });
    }
