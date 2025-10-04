import os
from flask import Flask
from src.config import config

app = Flask(__name__)
app.config.from_object(config['development'])

print('URI:', app.config['SQLALCHEMY_DATABASE_URI'])

# Test with SQLAlchemy directly
from sqlalchemy import create_engine
uri = app.config['SQLALCHEMY_DATABASE_URI']
print('Creating engine with URI:', uri)

try:
    engine = create_engine(uri)
    conn = engine.connect()
    print('Connection successful!')
    conn.close()
except Exception as e:
    print('Error:', e)
    
    # Try with absolute path
    abs_path = '/home/ubuntu/freelacash/backend/src/database/app.db'
    abs_uri = f'sqlite:///{abs_path}'
    print(f'\nTrying absolute URI: {abs_uri}')
    try:
        engine2 = create_engine(abs_uri)
        conn2 = engine2.connect()
        print('Absolute path connection successful!')
        conn2.close()
    except Exception as e2:
        print('Absolute path error:', e2)
