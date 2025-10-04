"""
Users routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.database import db, User, Review
from sqlalchemy import func

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def get_users():
    """Get all users with filters"""
    try:
        user_type = request.args.get('type')
        
        query = User.query
        
        if user_type:
            query = query.filter_by(user_type=user_type)
        
        users = query.all()
        
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID with detailed information"""
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        total_projects = len(user.projects_as_client) if user.user_type == 'client' else len(user.projects_as_freelancer)

        reviews = Review.query.filter_by(reviewed_id=user_id).order_by(Review.created_at.desc()).all()
        avg_rating = sum([r.rating for r in reviews]) / len(reviews) if reviews else 0

        recent_reviews = []
        for review in reviews[:5]:
            review_data = review.to_dict()
            reviewer = User.query.get(review.reviewer_id)
            project = review.project
            if reviewer:
                review_data['reviewer_name'] = reviewer.name
            if project:
                review_data['project_title'] = project.title
            recent_reviews.append(review_data)

        completed_projects = []
        if user.user_type == 'freelancer':
            completed = [p for p in user.projects_as_freelancer if p.status == 'completed']
            for project in completed[:5]:
                completed_projects.append({
                    'project_id': project.project_id,
                    'title': project.title,
                    'amount': project.amount,
                    'completed_at': project.completed_at.isoformat() if project.completed_at else None
                })

        return jsonify({
            'user': user.to_dict(),
            'wallet': user.wallet.to_dict() if user.wallet else None,
            'statistics': {
                'total_projects': total_projects,
                'average_rating': round(avg_rating, 2),
                'total_reviews': len(reviews)
            },
            'recent_reviews': recent_reviews,
            'completed_projects': completed_projects
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'profile_image' in data:
            user.profile_image = data['profile_image']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/freelancers', methods=['GET'])
def get_freelancers():
    """Get all freelancers sorted by reputation"""
    try:
        freelancers = User.query.filter_by(user_type='freelancer').order_by(User.reputation_score.desc()).all()
        
        result = []
        for freelancer in freelancers:
            reviews = Review.query.filter_by(reviewed_id=freelancer.user_id).all()
            avg_rating = sum([r.rating for r in reviews]) / len(reviews) if reviews else 0
            
            freelancer_data = freelancer.to_dict()
            freelancer_data['average_rating'] = round(avg_rating, 2)
            freelancer_data['total_reviews'] = len(reviews)
            freelancer_data['total_projects'] = len(freelancer.projects_as_freelancer)
            
            result.append(freelancer_data)
        
        return jsonify({
            'freelancers': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
