"""
Projects routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from src.models.database import db, Project, User, Review, Application

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    """Get all projects with filters"""
    try:
        user_id = get_jwt_identity()
        status = request.args.get('status')
        user_type = request.args.get('user_type')  # 'my_projects' or 'available'
        
        query = Project.query
        
        if user_type == 'my_projects':
            # Projetos do usuário (como cliente ou freelancer)
            query = query.filter(
                (Project.client_id == user_id) | (Project.freelancer_id == user_id)
            )
        elif user_type == 'available':
            # Projetos disponíveis para freelancers
            query = query.filter_by(status='open', freelancer_id=None)
        
        if status:
            query = query.filter_by(status=status)
        
        projects = query.order_by(Project.created_at.desc()).all()
        
        return jsonify({
            'projects': [project.to_dict() for project in projects]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    """Get project by ID"""
    try:
        project = Project.query.get(project_id)
        
        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        return jsonify({
            'project': project.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    """Create a new project"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.user_type != 'client':
            return jsonify({'error': 'Apenas clientes podem criar projetos'}), 403
        
        data = request.get_json()
        
        # Validação
        required_fields = ['title', 'description', 'amount']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Criar projeto
        project = Project(
            client_id=user_id,
            title=data['title'],
            description=data['description'],
            amount=float(data['amount']),
            deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None,
            status='open'
        )
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            'message': 'Projeto criado com sucesso',
            'project': project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<project_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_project(project_id):
    """Freelancer applies to a project with proposed amount"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.user_type != 'freelancer':
            return jsonify({'error': 'Apenas freelancers podem se candidatar a projetos'}), 403

        project = Project.query.get(project_id)

        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404

        if project.status != 'open':
            return jsonify({'error': 'Projeto não está disponível'}), 400

        existing_application = Application.query.filter_by(
            project_id=project_id,
            freelancer_id=user_id
        ).first()

        if existing_application:
            return jsonify({'error': 'Você já se candidatou a este projeto'}), 400

        data = request.get_json()

        if 'proposed_amount' not in data or float(data['proposed_amount']) <= 0:
            return jsonify({'error': 'Valor proposto é obrigatório e deve ser maior que zero'}), 400

        application = Application(
            project_id=project_id,
            freelancer_id=user_id,
            proposed_amount=float(data['proposed_amount']),
            cover_letter=data.get('cover_letter'),
            status='pending'
        )

        db.session.add(application)
        db.session.commit()

        return jsonify({
            'message': 'Candidatura enviada com sucesso',
            'application': application.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<project_id>/applications', methods=['GET'])
@jwt_required()
def get_project_applications(project_id):
    """Get all applications for a project"""
    try:
        user_id = get_jwt_identity()
        project = Project.query.get(project_id)

        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404

        if project.client_id != user_id:
            return jsonify({'error': 'Sem permissão para ver candidaturas deste projeto'}), 403

        applications = Application.query.filter_by(project_id=project_id).order_by(Application.created_at.desc()).all()

        result = []
        for app in applications:
            app_data = app.to_dict()
            freelancer = User.query.get(app.freelancer_id)
            if freelancer:
                reviews = Review.query.filter_by(reviewed_id=freelancer.user_id).all()
                avg_rating = sum([r.rating for r in reviews]) / len(reviews) if reviews else 0
                app_data['freelancer_average_rating'] = round(avg_rating, 2)
                app_data['freelancer_total_reviews'] = len(reviews)
                app_data['freelancer_total_projects'] = len(freelancer.projects_as_freelancer)
            result.append(app_data)

        return jsonify({'applications': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<project_id>/applications/<application_id>/accept', methods=['POST'])
@jwt_required()
def accept_application(project_id, application_id):
    """Client accepts a freelancer application"""
    try:
        user_id = get_jwt_identity()
        project = Project.query.get(project_id)

        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404

        if project.client_id != user_id:
            return jsonify({'error': 'Sem permissão para aceitar candidaturas deste projeto'}), 403

        if project.status != 'open':
            return jsonify({'error': 'Projeto não está mais aberto'}), 400

        application = Application.query.get(application_id)

        if not application or application.project_id != project_id:
            return jsonify({'error': 'Candidatura não encontrada'}), 404

        project.freelancer_id = application.freelancer_id
        project.amount = application.proposed_amount
        project.status = 'assigned'

        application.status = 'accepted'

        other_applications = Application.query.filter(
            Application.project_id == project_id,
            Application.application_id != application_id
        ).all()
        for other_app in other_applications:
            other_app.status = 'rejected'

        db.session.commit()

        return jsonify({
            'message': 'Candidatura aceita com sucesso',
            'project': project.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<project_id>/status', methods=['PUT'])
@jwt_required()
def update_project_status(project_id):
    """Update project status"""
    try:
        user_id = get_jwt_identity()
        project = Project.query.get(project_id)
        
        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        # Verificar permissão
        if project.client_id != user_id and project.freelancer_id != user_id:
            return jsonify({'error': 'Sem permissão para atualizar este projeto'}), 403
        
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Status é obrigatório'}), 400
        
        valid_statuses = ['open', 'assigned', 'funded', 'in_progress', 'delivered', 'completed', 'disputed', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'error': 'Status inválido'}), 400
        
        project.status = new_status
        
        if new_status == 'completed':
            project.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Status do projeto atualizado com sucesso',
            'project': project.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<project_id>/review', methods=['POST'])
@jwt_required()
def create_review(project_id):
    """Create a review for a project"""
    try:
        user_id = get_jwt_identity()
        project = Project.query.get(project_id)
        
        if not project:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        if project.status not in ['completed', 'awaiting_review']:
            return jsonify({'error': 'Projeto precisa estar aguardando avaliação ou completo para ser avaliado'}), 400
        
        # Verificar se usuário pode avaliar
        if project.client_id != user_id and project.freelancer_id != user_id:
            return jsonify({'error': 'Sem permissão para avaliar este projeto'}), 403
        
        # Determinar quem está sendo avaliado
        reviewed_id = project.freelancer_id if user_id == project.client_id else project.client_id
        
        # Verificar se já existe avaliação
        existing_review = Review.query.filter_by(
            project_id=project_id,
            reviewer_id=user_id,
            reviewed_id=reviewed_id
        ).first()
        
        if existing_review:
            return jsonify({'error': 'Você já avaliou este projeto'}), 400
        
        data = request.get_json()
        
        if 'rating' not in data or not (1 <= float(data['rating']) <= 5):
            return jsonify({'error': 'Rating deve estar entre 1 e 5'}), 400
        
        # Criar avaliação
        review = Review(
            project_id=project_id,
            reviewer_id=user_id,
            reviewed_id=reviewed_id,
            rating=float(data['rating']),
            comment=data.get('comment')
        )
        
        db.session.add(review)
        
        reviewed_user = User.query.get(reviewed_id)
        all_reviews = Review.query.filter_by(reviewed_id=reviewed_id).all()
        avg_rating = (sum([r.rating for r in all_reviews]) + float(data['rating'])) / (len(all_reviews) + 1)
        reviewed_user.reputation_score = round(avg_rating, 2)

        if project.status == 'awaiting_review':
            project.status = 'completed'

        db.session.commit()
        
        return jsonify({
            'message': 'Avaliação criada com sucesso',
            'review': review.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


