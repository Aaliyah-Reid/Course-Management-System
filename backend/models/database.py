from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection information
DB_HOST = os.getenv('DB_HOST')
DB_USERNAME = os.getenv('DB_USERNAME')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_NAME = os.getenv('DB_NAME')

# SQLAlchemy connection string
SQLALCHEMY_DATABASE_URI = f"mysql+mysqlconnector://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

# Create SQLAlchemy engine and session
engine = create_engine(SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

# Flask-SQLAlchemy instance
db = SQLAlchemy()

def get_db():
    """Get a database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()
