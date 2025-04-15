from flask import Flask, request, make_response
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    # Database connection details
    db_host = os.getenv('DB_HOST')
    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db = 'cms'

    return mysql.connector.connect(
        host=db_host, 
        user=db_username, 
        password=db_password, 
        database=db
    )

if __name__ == '__main__':
    app.run(port=6000, debug=True)