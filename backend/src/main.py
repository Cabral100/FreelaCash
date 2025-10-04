import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.config import config
from src.models.database import db
from src.routes.auth import auth_bp
from src.routes.users import users_bp
from src.routes.projects import projects_bp
from src.routes.wallets import wallets_bp
from src.routes.transactions import transactions_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuração
env = os.getenv('FLASK_ENV', 'development')
app.config.from_object(config[env])

# Extensões
CORS(app)
jwt = JWTManager(app)
db.init_app(app)

# Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(projects_bp, url_prefix='/api/projects')
app.register_blueprint(wallets_bp, url_prefix='/api/wallets')
app.register_blueprint(transactions_bp, url_prefix='/api/transactions')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
