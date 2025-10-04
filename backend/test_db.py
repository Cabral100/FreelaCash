import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from src.config import Config

print('DB_PATH:', Config.DB_PATH)
print('Database URI:', Config.SQLALCHEMY_DATABASE_URI)
print('File exists:', os.path.exists(Config.DB_PATH))
print('Directory exists:', os.path.exists(os.path.dirname(Config.DB_PATH)))
