USE Literaverse;
GO

IF NOT EXISTS (SELECT 1 FROM Autor WHERE nome_autor LIKE '%Guimar%')
BEGIN
    INSERT INTO Autor (nome_autor, ano_nascimento, ano_falecimento)
    VALUES (N'Rosa, João Guimarães', 1908, 1967);
END
GO

IF NOT EXISTS (SELECT 1 FROM Obra WHERE id_obra = 99001)
BEGIN
    INSERT INTO Obra (id_obra, nome_obra, descricao_obra, sinopse, faixa_etaria, capa_url)
    VALUES (99001, N'Grande Sertão: Veredas', N'Obra-prima do modernismo brasileiro', N'O jagunço Riobaldo narra suas memórias e seu pacto.', 16, NULL);
END
GO

IF NOT EXISTS (SELECT 1 FROM Escrever WHERE id_obra = 99001)
BEGIN
    INSERT INTO Escrever (id_obra, id_autor)
    SELECT 99001, id_autor FROM Autor WHERE nome_autor LIKE '%Guimar%';
END
GO

IF NOT EXISTS (SELECT 1 FROM Leitor WHERE id_leitor = 'user_demo_teste')
BEGIN
    INSERT INTO Leitor (id_leitor, nome_leitor, usuario_leitor, email_leitor, senha_leitor, data_nascimento)
    VALUES ('user_demo_teste', N'Leitor Demonstração', 'leitor_demo', 'demo@literaverse.com', 'hash_senha_123', '2000-05-15');
END
GO

UPDATE Obra
SET faixa_etaria = 18,
    sinopse = N'Sinopse atualizada: Obra clássica com reflexões existenciais e o amor por Diadorim.'
WHERE id_obra = 99001;
GO

UPDATE Leitor
SET nome_leitor = N'Leitor Demonstração Atualizado',
    data_nascimento = '1999-12-31'
WHERE id_leitor = 'user_demo_teste';
GO

SELECT id_obra, nome_obra, faixa_etaria, sinopse FROM Obra WHERE id_obra = 99001;
SELECT id_leitor, nome_leitor, data_nascimento FROM Leitor WHERE id_leitor = 'user_demo_teste';
GO

DELETE FROM Escrever WHERE id_obra = 99001;
DELETE FROM Obra WHERE id_obra = 99001;

DELETE FROM Ler WHERE id_leitor = 'user_demo_teste';
DELETE FROM Leitor WHERE id_leitor = 'user_demo_teste';
GO

SELECT
    O.id_obra AS [ID Obra],
    O.nome_obra AS [Título da Obra],
    O.faixa_etaria AS [Classificação],
    A.nome_autor AS [Autor],
    A.ano_nascimento AS [Nascimento],
    A.ano_falecimento AS [Falecimento]
FROM Obra O
JOIN Escrever E ON O.id_obra = E.id_obra
JOIN Autor A ON E.id_autor = A.id_autor
ORDER BY O.nome_obra;
GO

SELECT
    A.id_autor AS [ID Autor],
    A.nome_autor AS [Nome do Autor],
    COUNT(E.id_obra) AS [Total de Obras Cadastradas]
FROM Autor A
LEFT JOIN Escrever E ON A.id_autor = E.id_autor
GROUP BY A.id_autor, A.nome_autor
ORDER BY [Total de Obras Cadastradas] DESC, A.nome_autor;
GO

SELECT
    O.nome_obra AS [Obra],
    A.nome_autor AS [Autor]
FROM Obra O
JOIN Escrever E ON O.id_obra = E.id_obra
JOIN Autor A ON E.id_autor = A.id_autor
WHERE A.nome_autor LIKE N'%Machado de Assis%';
GO

DECLARE @offset INT = 0;
DECLARE @limit INT = 3;

WITH PaginatedWorks AS (
    SELECT id_obra
    FROM Obra
    ORDER BY nome_obra, id_obra
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
)
SELECT
    o.id_obra AS id,
    o.nome_obra AS titulo,
    o.descricao_obra AS descricao,
    o.faixa_etaria AS faixaEtaria,
    a.nome_autor AS nomeAutor
FROM PaginatedWorks p
JOIN Obra o ON o.id_obra = p.id_obra
LEFT JOIN Escrever e ON e.id_obra = o.id_obra
LEFT JOIN Autor a ON a.id_autor = e.id_autor
ORDER BY o.nome_obra, o.id_obra, a.nome_autor;
GO
