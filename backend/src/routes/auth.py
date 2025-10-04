"""
Authentication routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from src.models.database import db, User, Wallet

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validação
        required_fields = ['name', 'email', 'password', 'user_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        if data['user_type'] not in ['freelancer', 'client']:
            return jsonify({'error': 'Tipo de usuário inválido'}), 400
        
        # Verificar se email já existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Hash da senha
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Criar usuário
        user = User(
            name=data['name'],
            email=data['email'],
            password_hash=password_hash,
            user_type=data['user_type'],
            phone=data.get('phone')
        )
        db.session.add(user)
        db.session.flush()
        
        # Criar carteira
        wallet = Wallet(user_id=user.user_id)
        db.session.add(wallet)
        
        db.session.commit()
        
        # Gerar token
        access_token = create_access_token(identity=user.user_id)
        
        return jsonify({
            'message': 'Usuário registrado com sucesso',
            'user': user.to_dict(),
            'access_token': access_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        # Buscar usuário
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Verificar senha
        if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Gerar token
        access_token = create_access_token(identity=user.user_id)
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'user': user.to_dict(),
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        return jsonify({
            'user': user.to_dict(),
            'wallet': user.wallet.to_dict() if user.wallet else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
