import sqlite3
import os

# Database path
db_path = 'D:/Downloads/freelacash (1)/freelacash/backend/src/database/app.db'

# Remove old database if exists
if os.path.exists(db_path):
    os.remove(db_path)
    print(f'Removed old database: {db_path}')

# Create new database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print('Creating tables...')

# Users table
cursor.execute('''
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type TEXT NOT NULL,
    reputation_score REAL DEFAULT 0.0,
    profile_image TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Wallets table
cursor.execute('''
CREATE TABLE wallets (
    wallet_id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    balance REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'BRL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
)
''')

# Escrow wallet table
cursor.execute('''
CREATE TABLE escrow_wallet (
    wallet_id TEXT PRIMARY KEY,
    balance REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'BRL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Projects table
cursor.execute('''
CREATE TABLE projects (
    project_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    freelancer_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'open',
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(user_id),
    FOREIGN KEY (freelancer_id) REFERENCES users(user_id)
)
''')

# Transactions table
cursor.execute('''
CREATE TABLE transactions (
    transaction_id TEXT PRIMARY KEY,
    source_wallet_id TEXT,
    destination_wallet_id TEXT,
    escrow_wallet_id TEXT,
    project_id TEXT,
    amount REAL NOT NULL,
    transaction_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_wallet_id) REFERENCES wallets(wallet_id),
    FOREIGN KEY (destination_wallet_id) REFERENCES wallets(wallet_id),
    FOREIGN KEY (escrow_wallet_id) REFERENCES escrow_wallet(wallet_id),
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
)
''')

# Reviews table
cursor.execute('''
CREATE TABLE reviews (
    review_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    reviewed_id TEXT NOT NULL,
    rating REAL NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (reviewer_id) REFERENCES users(user_id),
    FOREIGN KEY (reviewed_id) REFERENCES users(user_id)
)
''')

# Disputes table
cursor.execute('''
CREATE TABLE disputes (
    dispute_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    raised_by TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (raised_by) REFERENCES users(user_id)
)
''')

# Insert escrow wallet
import uuid
escrow_id = str(uuid.uuid4())
cursor.execute('INSERT INTO escrow_wallet (wallet_id, balance, currency) VALUES (?, ?, ?)',
               (escrow_id, 0.0, 'BRL'))

conn.commit()
conn.close()

print(f'Database created successfully at: {db_path}')
print(f'Escrow wallet ID: {escrow_id}')
