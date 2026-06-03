document.addEventListener("DOMContentLoaded", () => {
  renderizarLivros();
});

function renderizarLivros() {
  const container = document.querySelector(".grid-livros");

  if (!container) {
    console.log("ERRO: .grid-livros não encontrado");
    return;
  }

  container.innerHTML = "";

  livros.forEach(livro => {
    const card = `
      <article class="cartao-livro">
        <a href="detalhe-livro.html">
          <img src="${livro.imagem}" class="imagem-livro">
        </a>
        <div class="info-livro">
          <h3 class="titulo-livro">${livro.titulo}</h3>
          <p class="autor-livro">${livro.autor}</p>
        </div>
      </article>
    `;

    container.innerHTML += card;
  });
}
