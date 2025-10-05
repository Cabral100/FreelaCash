"""
Database configuration and models
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'freelancer' or 'client'
    reputation_score = db.Column(db.Float, default=0.0)
    bio = db.Column(db.Text)
    profile_image = db.Column(db.String(500))
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    wallet = db.relationship('Wallet', backref='user', uselist=False, cascade='all, delete-orphan')
    projects_as_client = db.relationship('Project', foreign_keys='Project.client_id', backref='client')
    projects_as_freelancer = db.relationship('Project', foreign_keys='Project.freelancer_id', backref='freelancer')
    applications = db.relationship('Application', foreign_keys='Application.freelancer_id', backref='freelancer_apps', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'user_type': self.user_type,
            'reputation_score': self.reputation_score,
            'bio': self.bio,
            'profile_image': self.profile_image,
            'phone': self.phone,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Wallet(db.Model):
    __tablename__ = 'wallets'
    
    wallet_id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), unique=True, nullable=False)
    balance = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(3), default='BRL')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'wallet_id': self.wallet_id,
            'user_id': self.user_id,
            'balance': self.balance,
            'currency': self.currency,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class EscrowWallet(db.Model):
    __tablename__ = 'escrow_wallet'
    
    wallet_id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    balance = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(3), default='BRL')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Project(db.Model):
    __tablename__ = 'projects'

    project_id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    client_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    freelancer_id = db.Column(db.String(36), db.ForeignKey('users.user_id'))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='open')  # open, assigned, funded, in_progress, delivered, completed, disputed, cancelled
    deadline = db.Column(db.Date)
    deliverables = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    # Relationships
    transactions = db.relationship('Transaction', backref='project', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='project', cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='project', cascade='all, delete-orphan')

    def to_dict(self):
        import json
        deliverables_data = None
        if self.deliverables:
            try:
                deliverables_data = json.loads(self.deliverables)
            except:
                pass

        return {
            'project_id': self.project_id,
            'client_id': self.client_id,
            'freelancer_id': self.freelancer_id,
            'title': self.title,
            'description': self.description,
            'amount': self.amount,
            'status': self.status,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'client_name': self.client.name if self.client else None,
            'freelancer_name': self.freelancer.name if self.freelancer else None,
            'deliverables': deliverables_data.get('files', []) if deliverables_data else []
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    transaction_id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    source_wallet_id = db.Column(db.String(36), db.ForeignKey('wallets.wallet_id'))
    destination_wallet_id = db.Column(db.String(36), db.ForeignKey('wallets.wallet_id'))
    escrow_wallet_id = db.Column(db.String(36), db.ForeignKey('escrow_wallet.wallet_id'))
    project_id = db.Column(db.String(36), db.ForeignKey('projects.project_id'))
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # deposit, payment, release, withdrawal, refund
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, cancelled
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'transaction_id': self.transaction_id,
            'source_wallet_id': self.source_wallet_id,
            'destination_wallet_id': self.destination_wallet_id,
            'escrow_wallet_id': self.escrow_wallet_id,
            'project_id': self.project_id,
            'amount': self.amount,
            'transaction_type': self.transaction_type,
            'status': self.status,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Review(db.Model):
    __tablename__ = 'reviews'
    
    review_id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.project_id'), nullable=False)
    reviewer_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    reviewed_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    rating = db.Column(db.Float, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    reviewer = db.relationship('User', foreign_keys=[reviewer_id])
    reviewed = db.relationship('User', foreign_keys=[reviewed_id])
    
    def to_dict(self):
        return {
            'review_id': self.review_id,
            'project_id': self.project_id,
            'reviewer_id': self.reviewer_id,
            'reviewed_id': self.reviewed_id,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Dispute(db.Model):
    __tablename__ = 'disputes'
    
    dispute_id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.project_id'), nullable=False)
    raised_by = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open')  # open, investigating, resolved, closed
    resolution = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    
    # Relationships
    project = db.relationship('Project', backref='disputes')
    user = db.relationship('User', backref='disputes')
    
    def to_dict(self):
        return {
            'dispute_id': self.dispute_id,
            'project_id': self.project_id,
            'raised_by': self.raised_by,
            'reason': self.reason,
            'status': self.status,
            'resolution': self.resolution,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }

class Application(db.Model):
    __tablename__ = 'applications'

    application_id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.project_id'), nullable=False)
    freelancer_id = db.Column(db.String(36), db.ForeignKey('users.user_id'), nullable=False)
    proposed_amount = db.Column(db.Float, nullable=False)
    cover_letter = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    freelancer = db.relationship('User', foreign_keys=[freelancer_id])

    def to_dict(self):
        return {
            'application_id': self.application_id,
            'project_id': self.project_id,
            'freelancer_id': self.freelancer_id,
            'freelancer_name': self.freelancer.name if self.freelancer else None,
            'freelancer_reputation': self.freelancer.reputation_score if self.freelancer else 0,
            'proposed_amount': self.proposed_amount,
            'cover_letter': self.cover_letter,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
