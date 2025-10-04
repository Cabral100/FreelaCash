# FreelaCash - Instruções de Atualização

## Novas Funcionalidades Implementadas

1. **Sistema de Candidaturas**
   - Múltiplos freelancers podem se candidatar ao mesmo projeto
   - Cada freelancer propõe seu próprio valor
   - Cliente escolhe qual freelancer aceitar

2. **Perfil Detalhado do Freelancer**
   - Campo de descrição/bio adicionado
   - Tela mostrando avaliações recentes
   - Estatísticas completas do freelancer
   - Cliente pode clicar no freelancer para ver detalhes completos

3. **Avaliação Obrigatória**
   - Após liberar o pagamento, cliente é obrigado a avaliar o freelancer
   - Projeto fica com status "awaiting_review" até ser avaliado
   - Só muda para "completed" após a avaliação

4. **Sistema de Candidaturas Melhorado**
   - Freelancer envia candidatura com valor proposto e carta de apresentação
   - Cliente vê todas as candidaturas com informações do freelancer
   - Cliente pode ver perfil completo do freelancer antes de aceitar
   - Ao aceitar uma candidatura, as outras são automaticamente rejeitadas

## Alterações no Banco de Dados

### Novas Tabelas
- **applications**: Armazena as candidaturas dos freelancers aos projetos

### Novas Colunas
- **users.bio**: Campo de texto para descrição/biografia do freelancer

### Novo Status de Projeto
- **awaiting_review**: Status intermediário entre pagamento liberado e projeto concluído

## Como Atualizar o Banco de Dados

### Opção 1: Recriar o banco (PERDE DADOS EXISTENTES)
```bash
cd backend
rm -f src/database/app.db
pip install -r requirements.txt
python3 init_db.py
```

### Opção 2: Migração Manual (PRESERVA DADOS)
Execute os seguintes comandos SQL no seu banco de dados:

```sql
-- Adicionar coluna bio na tabela users
ALTER TABLE users ADD COLUMN bio TEXT;

-- Criar tabela applications
CREATE TABLE IF NOT EXISTS applications (
    application_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    freelancer_id TEXT NOT NULL,
    proposed_amount REAL NOT NULL,
    cover_letter TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (freelancer_id) REFERENCES users(user_id)
);
```

## Novos Endpoints da API

### Candidaturas
- `POST /api/projects/{project_id}/apply` - Freelancer se candidata ao projeto
- `GET /api/projects/{project_id}/applications` - Cliente lista candidaturas
- `POST /api/projects/{project_id}/applications/{application_id}/accept` - Cliente aceita candidatura

### Usuários
- `GET /api/users/{user_id}` - Agora retorna informações mais detalhadas incluindo avaliações recentes

## Fluxo Atualizado do Sistema

1. **Cliente cria projeto** → Status: `open`
2. **Freelancers se candidatam** com valores propostos
3. **Cliente visualiza candidaturas** e pode ver perfil completo de cada freelancer
4. **Cliente aceita uma candidatura** → Status: `assigned`
5. **Cliente financia o projeto** → Status: `funded`
6. **Freelancer entrega o projeto** → Status: `delivered`
7. **Cliente libera pagamento** → Status: `awaiting_review`
8. **Cliente DEVE avaliar o freelancer** → Status: `completed`

## Frontend Atualizado

### Novos Modais
- Modal de candidatura com valor proposto e carta de apresentação
- Modal de visualização de candidaturas com informações dos freelancers
- Modal de avaliação obrigatória após liberação do pagamento
- Modal de detalhes do freelancer com bio e avaliações

### Melhorias na UX
- Freelancers agora são clicáveis para ver detalhes
- Cliente pode ver todas as candidaturas antes de escolher
- Sistema força avaliação após pagamento
- Interface mostra o valor proposto por cada candidato

## Correções Implementadas

1. **Problema de Financiamento**: O sistema já estava funcionando corretamente. Certifique-se de que o cliente tem saldo suficiente na carteira antes de financiar.

2. **Status do Projeto**: Adicionado novo status "awaiting_review" para gerenciar melhor o fluxo de avaliações.

## Testando as Novas Funcionalidades

### Como Freelancer:
1. Veja projetos disponíveis
2. Clique em um projeto aberto
3. Clique em "Candidatar-se"
4. Informe o valor que deseja receber
5. Escreva uma carta de apresentação
6. Envie a candidatura

### Como Cliente:
1. Crie um projeto
2. Aguarde candidaturas
3. Clique em "Ver Candidaturas"
4. Veja perfil completo de cada candidato clicando em "Ver Perfil"
5. Aceite a candidatura desejada
6. Financia o projeto (certifique-se de ter saldo)
7. Após o freelancer entregar, libere o pagamento
8. OBRIGATÓRIO: Avalie o freelancer

## Notas Importantes

- O sistema agora permite múltiplos freelancers se candidatarem
- Cada freelancer propõe seu próprio valor
- A avaliação após pagamento é OBRIGATÓRIA
- O projeto só fica "completed" após a avaliação
- Cliente pode ver histórico completo de avaliações do freelancer
