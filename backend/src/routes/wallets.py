"""
Wallets routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.database import db, Wallet, User, Transaction

wallets_bp = Blueprint('wallets', __name__)

@wallets_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_wallet():
    """Get current user's wallet"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.wallet:
            return jsonify({'error': 'Carteira não encontrada'}), 404
        
        # Buscar transações recentes
        transactions = Transaction.query.filter(
            (Transaction.source_wallet_id == user.wallet.wallet_id) |
            (Transaction.destination_wallet_id == user.wallet.wallet_id)
        ).order_by(Transaction.created_at.desc()).limit(10).all()
        
        return jsonify({
            'wallet': user.wallet.to_dict(),
            'recent_transactions': [t.to_dict() for t in transactions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@wallets_bp.route('/deposit', methods=['POST'])
@jwt_required()
def deposit():
    """Deposit money into wallet (simulated)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.wallet:
            return jsonify({'error': 'Carteira não encontrada'}), 404
        
        data = request.get_json()
        
        if 'amount' not in data or float(data['amount']) <= 0:
            return jsonify({'error': 'Valor inválido'}), 400
        
        amount = float(data['amount'])
        
        # Atualizar saldo
        user.wallet.balance += amount
        
        # Criar transação
        transaction = Transaction(
            destination_wallet_id=user.wallet.wallet_id,
            amount=amount,
            transaction_type='deposit',
            status='completed',
            description=data.get('description', 'Depósito via gateway de pagamento')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Depósito realizado com sucesso',
            'wallet': user.wallet.to_dict(),
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@wallets_bp.route('/withdraw', methods=['POST'])
@jwt_required()
def withdraw():
    """Withdraw money from wallet"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.wallet:
            return jsonify({'error': 'Carteira não encontrada'}), 404
        
        data = request.get_json()
        
        if 'amount' not in data or float(data['amount']) <= 0:
            return jsonify({'error': 'Valor inválido'}), 400
        
        amount = float(data['amount'])
        
        if user.wallet.balance < amount:
            return jsonify({'error': 'Saldo insuficiente'}), 400
        
        # Atualizar saldo
        user.wallet.balance -= amount
        
        # Criar transação
        transaction = Transaction(
            source_wallet_id=user.wallet.wallet_id,
            amount=amount,
            transaction_type='withdrawal',
            status='completed',
            description=data.get('description', 'Saque para conta bancária')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Saque realizado com sucesso',
            'wallet': user.wallet.to_dict(),
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@wallets_bp.route('/balance', methods=['GET'])
@jwt_required()
def get_balance():
    """Get wallet balance"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.wallet:
            return jsonify({'error': 'Carteira não encontrada'}), 404
        
        return jsonify({
            'balance': user.wallet.balance,
            'currency': user.wallet.currency
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
