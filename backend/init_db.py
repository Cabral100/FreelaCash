import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from src.config import config
from src.models.database import db, EscrowWallet

# Create Flask app
app = Flask(__name__)
env = os.getenv('FLASK_ENV', 'development')
app.config.from_object(config[env])

print('Initializing database...')
print('Database URI:', app.config['SQLALCHEMY_DATABASE_URI'])

# Extract path
uri = app.config['SQLALCHEMY_DATABASE_URI']
if uri.startswith('sqlite:///'):
    db_path = uri.replace('sqlite:///', '')
    print('Database file path:', db_path)
    
    # Create directory if it doesn't exist
    db_dir = os.path.dirname(db_path)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
        print(f'Created directory: {db_dir}')
    
    # Create empty database file
    if not os.path.exists(db_path):
        open(db_path, 'a').close()
        print(f'Created database file: {db_path}')

# Initialize database
db.init_app(app)

with app.app_context():
    # Create all tables
    db.create_all()
    
    # Check if escrow wallet exists
    escrow = EscrowWallet.query.first()
    if not escrow:
        escrow = EscrowWallet()
        db.session.add(escrow)
        db.session.commit()
        print('Created escrow wallet')
    
    print('Database initialized successfully!')
    print('Escrow wallet ID:', escrow.wallet_id)
