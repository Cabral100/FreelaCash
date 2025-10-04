"""
FreelaCash Configuration
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-dev-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Use absolute path with 4 slashes for SQLite
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'app.db')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f"sqlite:///{DB_PATH}")
    
class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    
class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
