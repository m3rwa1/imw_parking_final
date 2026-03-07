from flask import Flask
from flask_cors import CORS
from app.config import config
from app.routes import auth, users, vehicles, subscriptions, reclamations, stats

def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {
        "origins": app.config['CORS_ORIGINS'],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }})
    
    # Register blueprints
    app.register_blueprint(auth.auth_bp)
    app.register_blueprint(users.users_bp)
    app.register_blueprint(vehicles.vehicles_bp)
    app.register_blueprint(subscriptions.subscriptions_bp)
    app.register_blueprint(reclamations.reclamations_bp)
    app.register_blueprint(stats.stats_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok', 'message': 'API is running'}, 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Endpoint not found'}, 404
    
    @app.errorhandler(500)
    def server_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app
