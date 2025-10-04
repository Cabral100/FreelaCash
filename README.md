# FreelaCash - Plataforma de Pagamento P2P para Freelancers

## Sobre o Projeto

**FreelaCash** é uma plataforma completa de pagamento peer-to-peer (P2P) com sistema de custódia (escrow) desenvolvida para conectar freelancers e clientes de forma segura e transparente.

### Funcionalidades Principais

✅ **Sistema de Custódia (Escrow)**
- Pagamentos seguros com retenção de valores até a conclusão do projeto
- Proteção para freelancers e clientes
- Liberação automática ou manual de fundos

✅ **Carteiras Digitais**
- Cada usuário possui uma carteira própria
- Saldo em tempo real
- Histórico completo de transações

✅ **Gerenciamento de Projetos**
- Criação e acompanhamento de projetos
- Status em tempo real (aberto, em andamento, concluído, cancelado)
- Sistema de propostas e aceitação

✅ **Sistema de Reputação**
- Score baseado em avaliações
- Histórico de trabalhos concluídos
- Comentários e ratings

✅ **Resolução de Disputas**
- Sistema de mediação integrado
- Abertura de disputas por qualquer parte
- Histórico de resoluções

## Tecnologias Utilizadas

### Backend
- **Python 3.11**
- **Flask** - Framework web
- **Flask-SQLAlchemy** - ORM para banco de dados
- **Flask-JWT-Extended** - Autenticação JWT
- **Flask-CORS** - Suporte a CORS
- **SQLite** - Banco de dados

### Frontend
- **HTML5**
- **CSS3** (tema preto e verde)
- **JavaScript** (Vanilla JS)
- **Fetch API** para comunicação com backend

## Estrutura do Projeto

```
freelacash/
├── backend/
│   ├── src/
│   │   ├── config.py              # Configurações da aplicação
│   │   ├── main.py                # Ponto de entrada do Flask
│   │   ├── models/
│   │   │   └── database.py        # Modelos do banco de dados
│   │   ├── routes/
│   │   │   ├── auth.py            # Rotas de autenticação
│   │   │   ├── users.py           # Rotas de usuários
│   │   │   ├── projects.py        # Rotas de projetos
│   │   │   ├── wallets.py         # Rotas de carteiras
│   │   │   └── transactions.py    # Rotas de transações/escrow
│   │   ├── static/
│   │   │   ├── index.html         # Interface principal
│   │   │   ├── styles.css         # Estilos (preto e verde)
│   │   │   └── app.js             # Lógica do frontend
│   │   └── database/
│   │       └── app.db             # Banco de dados SQLite
│   ├── venv/                      # Ambiente virtual Python
│   ├── requirements.txt           # Dependências Python
│   └── .env                       # Variáveis de ambiente
├── database_schema.sql            # Schema SQL do banco
└── README.md                      # Este arquivo
```

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login de usuário

### Usuários
- `GET /api/users/freelancers` - Listar freelancers
- `GET /api/users/clients` - Listar clientes
- `GET /api/users/<user_id>` - Detalhes de um usuário
- `PUT /api/users/<user_id>` - Atualizar perfil

### Projetos
- `POST /api/projects` - Criar novo projeto
- `GET /api/projects` - Listar projetos
- `GET /api/projects/<project_id>` - Detalhes de um projeto
- `PUT /api/projects/<project_id>/accept` - Aceitar projeto (freelancer)
- `PUT /api/projects/<project_id>/complete` - Marcar como concluído
- `PUT /api/projects/<project_id>/cancel` - Cancelar projeto

### Carteiras
- `GET /api/wallets/<user_id>` - Obter carteira do usuário
- `POST /api/wallets/<user_id>/deposit` - Depositar fundos
- `POST /api/wallets/<user_id>/withdraw` - Sacar fundos

### Transações (Escrow)
- `POST /api/transactions/escrow/deposit` - Depositar em custódia
- `POST /api/transactions/escrow/release` - Liberar fundos
- `POST /api/transactions/escrow/refund` - Reembolsar cliente
- `GET /api/transactions/<user_id>` - Histórico de transações

## Instalação e Configuração

### Pré-requisitos
- Python 3.11 ou superior
- pip (gerenciador de pacotes Python)

### Passo a Passo

1. **Clone o repositório**
```bash
cd /home/ubuntu/freelacash
```

2. **Crie o ambiente virtual**
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
```

3. **Instale as dependências**
```bash
pip install -r requirements.txt
```

4. **Configure as variáveis de ambiente**
Edite o arquivo `.env` com suas configurações:
```
SECRET_KEY=sua-chave-secreta-aqui
JWT_SECRET_KEY=sua-chave-jwt-aqui
FLASK_ENV=development
DATABASE_URL=sqlite:///src/database/app.db
```

5. **Crie o banco de dados**
```bash
python create_db_simple.py
```

6. **Inicie o servidor**
```bash
python src/main.py
```

O servidor estará rodando em `http://localhost:5000`

## Como Usar

### Para Clientes

1. **Registre-se** como cliente
2. **Deposite fundos** na sua carteira
3. **Crie um projeto** com descrição e valor
4. **Aguarde** um freelancer aceitar
5. O valor é **automaticamente depositado em custódia**
6. **Aprove a conclusão** para liberar o pagamento

### Para Freelancers

1. **Registre-se** como freelancer
2. **Navegue pelos projetos** disponíveis
3. **Aceite um projeto** que interesse
4. **Complete o trabalho**
5. **Receba o pagamento** após aprovação do cliente

## Sistema de Custódia (Escrow)

O FreelaCash utiliza um sistema de custódia inteligente:

1. **Depósito**: Quando um projeto é aceito, o valor é transferido da carteira do cliente para a custódia
2. **Retenção**: Os fundos ficam retidos até a conclusão do projeto
3. **Liberação**: Após aprovação do cliente, os fundos são transferidos para o freelancer
4. **Reembolso**: Em caso de cancelamento ou disputa, os fundos podem retornar ao cliente

## Segurança

- **Autenticação JWT**: Tokens seguros para autenticação
- **Hash de senhas**: Senhas armazenadas com bcrypt
- **CORS configurado**: Proteção contra requisições não autorizadas
- **Validação de dados**: Todas as entradas são validadas

## Deploy

Para fazer deploy da aplicação:

```bash
# Certifique-se de que o servidor está configurado para produção
export FLASK_ENV=production

# Execute o servidor com Gunicorn (recomendado)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
```

## Melhorias Futuras

- [ ] Integração com gateways de pagamento reais (Stripe, PayPal, PagSeguro)
- [ ] Sistema de notificações em tempo real
- [ ] Chat entre cliente e freelancer
- [ ] Upload de arquivos para projetos
- [ ] Sistema de milestones (pagamentos parciais)
- [ ] Aplicativo mobile
- [ ] Suporte a múltiplas moedas
- [ ] Sistema de verificação de identidade (KYC)

## Suporte

Para dúvidas ou problemas, entre em contato através do repositório.

## Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

---

**Desenvolvido com ❤️ para a comunidade de freelancers**
