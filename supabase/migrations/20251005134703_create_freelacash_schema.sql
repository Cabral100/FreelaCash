/*
  # FreelaCash - Schema Completo

  ## Visão Geral
  Este migration cria toda a estrutura do banco de dados para a plataforma FreelaCash,
  incluindo usuários, carteiras, projetos, transações, avaliações e candidaturas.

  ## Tabelas Criadas
  
  ### 1. users
  - Armazena informações de freelancers e clientes
  - Campos: user_id, name, email, password_hash, user_type, reputation_score, bio, profile_image, phone
  
  ### 2. wallets
  - Carteira digital de cada usuário
  - Campos: wallet_id, user_id, balance, currency
  
  ### 3. escrow_wallet
  - Carteira de custódia para retenção de pagamentos
  - Campos: wallet_id, balance, currency
  
  ### 4. projects
  - Projetos criados por clientes
  - Campos: project_id, client_id, freelancer_id, title, description, amount, status, deadline, deliverables
  - Status: open, assigned, funded, in_progress, delivered, completed, awaiting_review, disputed, cancelled
  
  ### 5. applications
  - Candidaturas de freelancers aos projetos
  - Campos: application_id, project_id, freelancer_id, proposed_amount, cover_letter, status
  
  ### 6. transactions
  - Histórico de todas as transações
  - Campos: transaction_id, source_wallet_id, destination_wallet_id, escrow_wallet_id, project_id, amount, transaction_type, status, description
  
  ### 7. reviews
  - Avaliações entre clientes e freelancers
  - Campos: review_id, project_id, reviewer_id, reviewed_id, rating, comment
  
  ### 8. disputes
  - Disputas abertas em projetos
  - Campos: dispute_id, project_id, raised_by, reason, status, resolution
  
  ### 9. deliverables
  - Arquivos de entrega dos projetos
  - Campos: deliverable_id, project_id, filename, file_url, file_size, uploaded_by, description

  ## Segurança
  - RLS (Row Level Security) habilitado em todas as tabelas
  - Políticas restritivas baseadas em autenticação e ownership
  - Validações de integridade com foreign keys
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('freelancer', 'client')),
    reputation_score REAL DEFAULT 0.0,
    bio TEXT,
    profile_image TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de carteiras
CREATE TABLE IF NOT EXISTS wallets (
    wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    balance REAL DEFAULT 0.0 CHECK (balance >= 0),
    currency TEXT DEFAULT 'BRL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar carteira de escrow
CREATE TABLE IF NOT EXISTS escrow_wallet (
    wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    balance REAL DEFAULT 0.0 CHECK (balance >= 0),
    currency TEXT DEFAULT 'BRL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir carteira de escrow padrão se não existir
INSERT INTO escrow_wallet (wallet_id, balance, currency)
SELECT uuid_generate_v4(), 0.0, 'BRL'
WHERE NOT EXISTS (SELECT 1 FROM escrow_wallet LIMIT 1);

-- Criar tabela de projetos
CREATE TABLE IF NOT EXISTS projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'funded', 'in_progress', 'delivered', 'completed', 'awaiting_review', 'disputed', 'cancelled')),
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Criar tabela de candidaturas
CREATE TABLE IF NOT EXISTS applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    proposed_amount REAL NOT NULL CHECK (proposed_amount > 0),
    cover_letter TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, freelancer_id)
);

-- Criar tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_wallet_id UUID REFERENCES wallets(wallet_id),
    destination_wallet_id UUID REFERENCES wallets(wallet_id),
    escrow_wallet_id UUID REFERENCES escrow_wallet(wallet_id),
    project_id UUID REFERENCES projects(project_id) ON DELETE SET NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'payment', 'release', 'withdrawal', 'refund')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de avaliações
CREATE TABLE IF NOT EXISTS reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating REAL NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, reviewer_id)
);

-- Criar tabela de disputas
CREATE TABLE IF NOT EXISTS disputes (
    dispute_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Criar tabela de deliverables (arquivos de entrega)
CREATE TABLE IF NOT EXISTS deliverables (
    deliverable_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    uploaded_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_freelancer_id ON projects(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_applications_project_id ON applications(project_id);
CREATE INDEX IF NOT EXISTS idx_applications_freelancer_id ON applications(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON deliverables(project_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users (acesso público para leitura, apenas próprio usuário pode editar)
CREATE POLICY "Usuários podem ver perfis públicos"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text);

-- Políticas RLS para wallets (apenas o dono pode ver e editar)
CREATE POLICY "Usuários podem ver própria carteira"
    ON wallets FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem atualizar própria carteira"
    ON wallets FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id::text);

-- Políticas RLS para escrow_wallet (apenas leitura para todos)
CREATE POLICY "Todos podem ver carteira de escrow"
    ON escrow_wallet FOR SELECT
    USING (true);

-- Políticas RLS para projects (público pode ver, apenas dono pode editar)
CREATE POLICY "Projetos são visíveis publicamente"
    ON projects FOR SELECT
    USING (true);

CREATE POLICY "Cliente pode criar projetos"
    ON projects FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = client_id::text);

CREATE POLICY "Cliente e freelancer podem atualizar projeto"
    ON projects FOR UPDATE
    TO authenticated
    USING (
        auth.uid()::text = client_id::text OR 
        auth.uid()::text = freelancer_id::text
    );

-- Políticas RLS para applications
CREATE POLICY "Candidaturas são visíveis para cliente e candidato"
    ON applications FOR SELECT
    TO authenticated
    USING (
        auth.uid()::text = freelancer_id::text OR
        auth.uid()::text IN (
            SELECT client_id::text FROM projects WHERE project_id = applications.project_id
        )
    );

CREATE POLICY "Freelancers podem criar candidaturas"
    ON applications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = freelancer_id::text);

CREATE POLICY "Cliente pode atualizar status da candidatura"
    ON applications FOR UPDATE
    TO authenticated
    USING (
        auth.uid()::text IN (
            SELECT client_id::text FROM projects WHERE project_id = applications.project_id
        )
    );

-- Políticas RLS para transactions (apenas envolvidos podem ver)
CREATE POLICY "Usuários podem ver próprias transações"
    ON transactions FOR SELECT
    TO authenticated
    USING (
        auth.uid()::text IN (
            SELECT user_id::text FROM wallets 
            WHERE wallet_id::text = source_wallet_id::text OR wallet_id::text = destination_wallet_id::text
        )
    );

CREATE POLICY "Sistema pode criar transações"
    ON transactions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Políticas RLS para reviews (público pode ver, apenas participantes podem criar)
CREATE POLICY "Avaliações são visíveis publicamente"
    ON reviews FOR SELECT
    USING (true);

CREATE POLICY "Participantes do projeto podem criar avaliações"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid()::text = reviewer_id::text AND
        auth.uid()::text IN (
            SELECT client_id::text FROM projects WHERE project_id = reviews.project_id
            UNION
            SELECT freelancer_id::text FROM projects WHERE project_id = reviews.project_id
        )
    );

-- Políticas RLS para disputes
CREATE POLICY "Disputas são visíveis para envolvidos"
    ON disputes FOR SELECT
    TO authenticated
    USING (
        auth.uid()::text = raised_by::text OR
        auth.uid()::text IN (
            SELECT client_id::text FROM projects WHERE project_id = disputes.project_id
            UNION
            SELECT freelancer_id::text FROM projects WHERE project_id = disputes.project_id
        )
    );

CREATE POLICY "Participantes podem criar disputas"
    ON disputes FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid()::text = raised_by::text AND
        auth.uid()::text IN (
            SELECT client_id::text FROM projects WHERE project_id = disputes.project_id
            UNION
            SELECT freelancer_id::text FROM projects WHERE project_id = disputes.project_id
        )
    );

-- Políticas RLS para deliverables
CREATE POLICY "Deliverables são visíveis para cliente e freelancer"
    ON deliverables FOR SELECT
    TO authenticated
    USING (
        auth.uid()::text IN (
            SELECT client_id::text FROM projects WHERE project_id = deliverables.project_id
            UNION
            SELECT freelancer_id::text FROM projects WHERE project_id = deliverables.project_id
        )
    );

CREATE POLICY "Freelancer pode fazer upload de deliverables"
    ON deliverables FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid()::text = uploaded_by::text AND
        auth.uid()::text IN (
            SELECT freelancer_id::text FROM projects WHERE project_id = deliverables.project_id
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_wallet_updated_at BEFORE UPDATE ON escrow_wallet
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();