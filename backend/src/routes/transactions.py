"""
Transactions routes - Escrow System
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.database import db, Transaction, Project, User, Wallet, EscrowWallet

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get user's transactions"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.wallet:
            return jsonify({'error': 'Carteira não encontrada'}), 404
        
        transactions = Transaction.query.filter(
            (Transaction.source_wallet_id == user.wallet.wallet_id) |
            (Transaction.destination_wallet_id == user.wallet.wallet_id)
        ).order_by(Transaction.created_at.desc()).all()
        
        return jsonify({
            'transactions': [t.to_dict() for t in transactions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/fund-project/<project_id>', methods=['POST'])
@jwt_required()
def fund_project(project_id):
    """Fund a project (move money to escrow)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.wallet:
            return jsonify({'error': 'Carteira não encontrada'}), 404
        
        project = Project.query.get(project_id)
        
        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        if project.client_id != user_id:
            return jsonify({'error': 'Apenas o cliente pode financiar o projeto'}), 403
        
        if project.status != 'assigned':
            return jsonify({'error': 'Projeto precisa estar atribuído para ser financiado'}), 400
        
        if user.wallet.balance < project.amount:
            return jsonify({'error': 'Saldo insuficiente'}), 400
        
        # Buscar carteira de escrow
        escrow = EscrowWallet.query.first()
        
        if not escrow:
            return jsonify({'error': 'Sistema de custódia não disponível'}), 500
        
        # Transferir fundos para escrow
        user.wallet.balance -= project.amount
        escrow.balance += project.amount
        
        # Criar transação
        transaction = Transaction(
            source_wallet_id=user.wallet.wallet_id,
            escrow_wallet_id=escrow.wallet_id,
            project_id=project_id,
            amount=project.amount,
            transaction_type='payment',
            status='completed',
            description=f'Pagamento em custódia para o projeto: {project.title}'
        )
        
        db.session.add(transaction)
        
        # Atualizar status do projeto
        project.status = 'funded'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Projeto financiado com sucesso',
            'project': project.to_dict(),
            'transaction': transaction.to_dict(),
            'wallet': user.wallet.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/release-payment/<project_id>', methods=['POST'])
@jwt_required()
def release_payment(project_id):
    """Release payment from escrow to freelancer"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        project = Project.query.get(project_id)
        
        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        if project.client_id != user_id:
            return jsonify({'error': 'Apenas o cliente pode liberar o pagamento'}), 403
        
        if project.status not in ['delivered', 'funded', 'in_progress']:
            return jsonify({'error': 'Projeto não está pronto para liberação de pagamento'}), 400
        
        if not project.freelancer_id:
            return jsonify({'error': 'Projeto não possui freelancer atribuído'}), 400
        
        freelancer = User.query.get(project.freelancer_id)
        
        if not freelancer or not freelancer.wallet:
            return jsonify({'error': 'Carteira do freelancer não encontrada'}), 404
        
        # Buscar carteira de escrow
        escrow = EscrowWallet.query.first()
        
        if not escrow or escrow.balance < project.amount:
            return jsonify({'error': 'Fundos não disponíveis em custódia'}), 500
        
        # Transferir fundos do escrow para freelancer
        escrow.balance -= project.amount
        freelancer.wallet.balance += project.amount
        
        # Criar transação
        transaction = Transaction(
            escrow_wallet_id=escrow.wallet_id,
            destination_wallet_id=freelancer.wallet.wallet_id,
            project_id=project_id,
            amount=project.amount,
            transaction_type='release',
            status='completed',
            description=f'Liberação de pagamento do projeto: {project.title}'
        )
        
        db.session.add(transaction)
        
        # Atualizar status do projeto
        project.status = 'completed'
        
        from datetime import datetime
        project.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Pagamento liberado com sucesso',
            'project': project.to_dict(),
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/refund/<project_id>', methods=['POST'])
@jwt_required()
def refund_project(project_id):
    """Refund project (return money from escrow to client)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        project = Project.query.get(project_id)
        
        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        # Apenas cliente ou admin pode solicitar reembolso
        if project.client_id != user_id:
            return jsonify({'error': 'Sem permissão para reembolsar este projeto'}), 403
        
        if project.status not in ['funded', 'disputed']:
            return jsonify({'error': 'Projeto não pode ser reembolsado neste status'}), 400
        
        client = User.query.get(project.client_id)
        
        if not client or not client.wallet:
            return jsonify({'error': 'Carteira do cliente não encontrada'}), 404
        
        # Buscar carteira de escrow
        escrow = EscrowWallet.query.first()
        
        if not escrow or escrow.balance < project.amount:
            return jsonify({'error': 'Fundos não disponíveis em custódia'}), 500
        
        # Transferir fundos do escrow de volta para cliente
        escrow.balance -= project.amount
        client.wallet.balance += project.amount
        
        # Criar transação
        transaction = Transaction(
            escrow_wallet_id=escrow.wallet_id,
            destination_wallet_id=client.wallet.wallet_id,
            project_id=project_id,
            amount=project.amount,
            transaction_type='refund',
            status='completed',
            description=f'Reembolso do projeto: {project.title}'
        )
        
        db.session.add(transaction)
        
        # Atualizar status do projeto
        project.status = 'cancelled'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Reembolso realizado com sucesso',
            'project': project.to_dict(),
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
