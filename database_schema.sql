-- FreelaCash Database Schema
-- PostgreSQL 13+

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Usuários
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('freelancer', 'client')),
    reputation_score DECIMAL(3, 2) DEFAULT 0.00 CHECK (reputation_score >= 0 AND reputation_score <= 5.00),
    profile_image VARCHAR(500),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Carteiras
CREATE TABLE wallets (
    wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(3) DEFAULT 'BRL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carteira de Custódia do Sistema
CREATE TABLE escrow_wallet (
    wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    balance DECIMAL(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(3) DEFAULT 'BRL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Projetos
CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'funded', 'in_progress', 'delivered', 'completed', 'disputed', 'cancelled')),
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Tabela de Transações
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE SET NULL,
    destination_wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE SET NULL,
    escrow_wallet_id UUID REFERENCES escrow_wallet(wallet_id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(project_id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'payment', 'release', 'withdrawal', 'refund')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Avaliações
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Disputas
CREATE TABLE disputes (
    dispute_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Índices para otimização
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_freelancer ON projects(freelancer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_transactions_project ON transactions(project_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_reviews_project ON reviews(project_id);
CREATE INDEX idx_disputes_project ON disputes(project_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir carteira de custódia do sistema
INSERT INTO escrow_wallet (wallet_id, balance, currency) 
VALUES (uuid_generate_v4(), 0.00, 'BRL');

-- View para estatísticas de usuários
CREATE VIEW user_statistics AS
SELECT 
    u.user_id,
    u.name,
    u.user_type,
    u.reputation_score,
    w.balance,
    COUNT(DISTINCT CASE WHEN u.user_type = 'client' THEN p.project_id END) as projects_created,
    COUNT(DISTINCT CASE WHEN u.user_type = 'freelancer' THEN p.project_id END) as projects_completed,
    AVG(r.rating) as average_rating,
    COUNT(DISTINCT r.review_id) as total_reviews
FROM users u
LEFT JOIN wallets w ON u.user_id = w.user_id
LEFT JOIN projects p ON (u.user_id = p.client_id OR u.user_id = p.freelancer_id)
LEFT JOIN reviews r ON u.user_id = r.reviewed_id
GROUP BY u.user_id, u.name, u.user_type, u.reputation_score, w.balance;

-- View para dashboard de projetos
CREATE VIEW project_dashboard AS
SELECT 
    p.project_id,
    p.title,
    p.description,
    p.amount,
    p.status,
    p.deadline,
    c.name as client_name,
    c.email as client_email,
    f.name as freelancer_name,
    f.email as freelancer_email,
    p.created_at,
    p.updated_at
FROM projects p
JOIN users c ON p.client_id = c.user_id
LEFT JOIN users f ON p.freelancer_id = f.user_id;
