"""
Add deliverables column to projects table
"""
import os
import sys
from sqlalchemy import create_engine, text

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.config import Config

def add_deliverables_column():
    """Add deliverables column to projects table"""
    try:
        engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)

        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS deliverables TEXT"))
            conn.commit()

        print("Successfully added deliverables column to projects table")

    except Exception as e:
        print(f"Error adding deliverables column: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    add_deliverables_column()
