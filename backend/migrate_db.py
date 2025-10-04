import os
import sys
import sqlite3

sys.path.insert(0, os.path.dirname(__file__))

from src.config import config

env = os.getenv('FLASK_ENV', 'development')
db_uri = config[env].SQLALCHEMY_DATABASE_URI

if db_uri.startswith('sqlite:///'):
    db_path = db_uri.replace('sqlite:///', '')
    print(f'Migrating database at: {db_path}')

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print('Adding bio column to users table...')
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN bio TEXT')
        print('  - bio column added')
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e):
            print('  - bio column already exists')
        else:
            raise

    print('Creating applications table...')
    try:
        cursor.execute('''
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
            )
        ''')
        print('  - applications table created')
    except Exception as e:
        print(f'  - Error creating applications table: {e}')

    conn.commit()
    conn.close()

    print('\nMigration completed successfully!')
else:
    print('Not a SQLite database, skipping migration')
