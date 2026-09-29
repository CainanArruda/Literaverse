CREATE DATABASE Literaverse;
GO
USE Literaverse;
GO

CREATE TABLE Genero(
    id_genero INT PRIMARY KEY IDENTITY(1,1),
    nome_genero VARCHAR(50) NOT NULL,
    descricao_genero VARCHAR(500) NULL
);

CREATE TABLE Obra(
    id_obra INT PRIMARY KEY NOT NULL,
    nome_obra VARCHAR(255) NOT NULL,
    descricao_obra VARCHAR(MAX) NULL,
    sinopse VARCHAR(MAX) NULL,
    faixa_etaria INT DEFAULT 0,
    capa_url VARCHAR(500) NULL
);

CREATE TABLE Leitor(
    id_leitor VARCHAR(50) PRIMARY KEY NOT NULL,
    nome_leitor VARCHAR(100) NOT NULL,
    usuario_leitor VARCHAR(50) UNIQUE NOT NULL,
    email_leitor VARCHAR(100) UNIQUE NOT NULL,
    senha_leitor VARCHAR(255) NOT NULL,
    data_nascimento DATE NULL,
    data_cadastro DATETIME DEFAULT GETDATE(),
    foto_perfil VARCHAR(500) NULL
);

CREATE TABLE Autor(
    id_autor INT PRIMARY KEY IDENTITY(1,1),
    nome_autor VARCHAR(100) NOT NULL,
    email_autor VARCHAR(100) NULL,
    senha_autor VARCHAR(255) NULL,
    ano_nascimento INT NULL,
    ano_falecimento INT NULL
);

CREATE TABLE Rascunho(
    id_rascunho INT PRIMARY KEY IDENTITY(1,1),
    nome_rascunho VARCHAR(100) NOT NULL,
    descricao_rascunho VARCHAR(MAX) NULL,
    id_autor INT NOT NULL,
    id_obra INT NULL,
    FOREIGN KEY (id_autor) REFERENCES Autor(id_autor),
    FOREIGN KEY (id_obra) REFERENCES Obra(id_obra)
);

CREATE TABLE Ler(
    id_leitor VARCHAR(50) NOT NULL,
    id_obra INT NOT NULL,
    data_leitura DATETIME DEFAULT GETDATE(),
    PRIMARY KEY(id_leitor, id_obra),
    FOREIGN KEY (id_leitor) REFERENCES Leitor(id_leitor),
    FOREIGN KEY (id_obra) REFERENCES Obra(id_obra)
);

CREATE TABLE Obra_genero(
    id_obra INT NOT NULL,
    id_genero INT NOT NULL,
    PRIMARY KEY(id_obra, id_genero),
    FOREIGN KEY (id_obra) REFERENCES Obra(id_obra),
    FOREIGN KEY (id_genero) REFERENCES Genero(id_genero)
);

CREATE TABLE Escrever(
    id_obra INT NOT NULL,
    id_autor INT NOT NULL,
    PRIMARY KEY(id_obra, id_autor),
    FOREIGN KEY (id_obra) REFERENCES Obra(id_obra),
    FOREIGN KEY (id_autor) REFERENCES Autor(id_autor)
);
