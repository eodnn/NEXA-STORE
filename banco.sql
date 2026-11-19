-- NEXA STORE · MySQL 8+ · execute todo o arquivo no MySQL Workbench.
-- Dados e hash bcrypt são criados depois com: npm run setup
CREATE DATABASE IF NOT EXISTS nexa_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nexa_store;

CREATE TABLE IF NOT EXISTS usuarios (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(120) NOT NULL,
 email VARCHAR(190) NOT NULL UNIQUE,
 senha_hash VARCHAR(255) NOT NULL,
 perfil ENUM('admin','operador') NOT NULL DEFAULT 'operador',
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS categorias (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(100) NOT NULL UNIQUE,
 descricao VARCHAR(255) DEFAULT NULL,
 ativo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS fornecedores (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(140) NOT NULL,
 email VARCHAR(190) UNIQUE,
 telefone VARCHAR(25),
 cnpj VARCHAR(18) UNIQUE,
 cidade VARCHAR(100),
 ativo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS clientes (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(140) NOT NULL,
 email VARCHAR(190) UNIQUE,
 telefone VARCHAR(25),
 cpf VARCHAR(14) UNIQUE,
 endereco VARCHAR(255),
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS produtos (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(150) NOT NULL,
 sku VARCHAR(70) NOT NULL UNIQUE,
 descricao TEXT,
 categoria_id INT UNSIGNED NOT NULL,
 fornecedor_id INT UNSIGNED DEFAULT NULL,
 custo DECIMAL(12,2) NOT NULL DEFAULT 0,
 preco DECIMAL(12,2) NOT NULL,
 estoque INT UNSIGNED NOT NULL DEFAULT 0,
 estoque_minimo INT UNSIGNED NOT NULL DEFAULT 5,
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_produto_categoria FOREIGN KEY(categoria_id) REFERENCES categorias(id),
 CONSTRAINT fk_produto_fornecedor FOREIGN KEY(fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL,
 CONSTRAINT ck_produto_custo CHECK (custo >= 0),
 CONSTRAINT ck_produto_preco CHECK (preco > 0),
 INDEX idx_produto_nome(nome), INDEX idx_produto_categoria(categoria_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS vendas (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 codigo VARCHAR(48) NOT NULL UNIQUE,
 chave_idempotencia VARCHAR(80) NOT NULL UNIQUE,
 cliente_id INT UNSIGNED DEFAULT NULL,
 usuario_id INT UNSIGNED NOT NULL,
 subtotal DECIMAL(12,2) NOT NULL,
 desconto DECIMAL(12,2) NOT NULL DEFAULT 0,
 total DECIMAL(12,2) NOT NULL,
 status ENUM('concluida','cancelada') NOT NULL DEFAULT 'concluida',
 criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 cancelada_em DATETIME DEFAULT NULL,
 CONSTRAINT fk_venda_cliente FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
 CONSTRAINT fk_venda_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
 CONSTRAINT ck_venda_valor CHECK (subtotal >= 0 AND desconto >= 0 AND total >= 0),
 INDEX idx_venda_data(criada_em), INDEX idx_venda_cliente(cliente_id)
) ENGINE=InnoDB;
-- Relação N:N: muitas vendas contêm muitos produtos, via tabela itens_venda.
CREATE TABLE IF NOT EXISTS itens_venda (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 venda_id INT UNSIGNED NOT NULL,
 produto_id INT UNSIGNED NOT NULL,
 quantidade INT UNSIGNED NOT NULL,
 preco_unitario DECIMAL(12,2) NOT NULL,
 total DECIMAL(12,2) NOT NULL,
 CONSTRAINT fk_item_venda FOREIGN KEY(venda_id) REFERENCES vendas(id),
 CONSTRAINT fk_item_produto FOREIGN KEY(produto_id) REFERENCES produtos(id),
 CONSTRAINT uq_item_produto UNIQUE(venda_id, produto_id),
 CONSTRAINT ck_item_quantidade CHECK (quantidade > 0),
 INDEX idx_item_produto(produto_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS pagamentos (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 venda_id INT UNSIGNED NOT NULL UNIQUE,
 metodo ENUM('pix','dinheiro','debito','credito') NOT NULL,
 valor DECIMAL(12,2) NOT NULL,
 status ENUM('registrado','estornado') NOT NULL DEFAULT 'registrado',
 registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_pagamento_venda FOREIGN KEY(venda_id) REFERENCES vendas(id),
 CONSTRAINT ck_pagamento_valor CHECK (valor >= 0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 produto_id INT UNSIGNED NOT NULL,
 usuario_id INT UNSIGNED DEFAULT NULL,
 venda_id INT UNSIGNED DEFAULT NULL,
 tipo ENUM('entrada','saida','ajuste','estorno') NOT NULL,
 quantidade INT NOT NULL,
 estoque_anterior INT UNSIGNED NOT NULL,
 estoque_posterior INT UNSIGNED NOT NULL,
 observacao VARCHAR(255),
 criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_mov_produto FOREIGN KEY(produto_id) REFERENCES produtos(id),
 CONSTRAINT fk_mov_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
 CONSTRAINT fk_mov_venda FOREIGN KEY(venda_id) REFERENCES vendas(id),
 INDEX idx_mov_data(criada_em), INDEX idx_mov_produto(produto_id)
) ENGINE=InnoDB;
