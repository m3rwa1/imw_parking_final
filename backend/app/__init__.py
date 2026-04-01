import logging
from logging.handlers import RotatingFileHandler
import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app.config import config

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["10000/day", "1000/hour", "100/minute"],
    storage_uri="memory://"
)


def create_app(config_name='development'):
    app = Flask(__name__)

    app.config.from_object(config[config_name])

    _setup_logging(app)
    
    CORS(app, resources={r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }})

    limiter.init_app(app)

    from app.routes.auth          import auth_bp
    from app.routes.users         import users_bp
    from app.routes.vehicles      import vehicles_bp
    from app.routes.subscriptions import subscriptions_bp
    from app.routes.reclamations  import reclamations_bp
    from app.routes.stats         import stats_bp
    from app.routes.payments      import payments_bp
    from app.routes.spaces        import spaces_bp
    from app.routes.reports       import reports_bp
    from app.routes.pricing       import pricing_bp
    from app.routes.logs          import logs_bp
    from app.routes.reservations  import reservations_bp
    from app.routes.user_relations import user_relations_bp
    
    app.register_blueprint(logs_bp)
    app.register_blueprint(reservations_bp)
    app.register_blueprint(pricing_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(subscriptions_bp)
    app.register_blueprint(reclamations_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(spaces_bp)
    app.register_blueprint(user_relations_bp)

    _start_scheduler(app)


    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'message': 'IMW Parking API running'}), 200

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': 'Bad request', 'details': str(e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method not allowed'}), 405

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({'error': 'Too many requests', 'message': str(e.description)}), 429

    @app.errorhandler(500)
    def server_error(e):
        app.logger.error(f'Internal server error: {e}')
        return jsonify({'error': 'Internal server error'}), 500

    return app


def _setup_logging(app: Flask):
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)

    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )

    file_handler = RotatingFileHandler(
        os.path.join(log_dir, 'imw_parking.log'),
        maxBytes=5 * 1024 * 1024,
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('IMW Parking API startup')


def _start_scheduler(app: Flask):
    try:
        from apscheduler.schedulers.background import BackgroundScheduler

        scheduler = BackgroundScheduler()
        scheduler.add_job(
            func=lambda: _expire_subscriptions(app),
            trigger='cron',
            hour=0,
            minute=0,
            id='expire_subscriptions'
        )
        scheduler.start()
        app.logger.info('Scheduler started: subscription auto-expiry active')
    except ImportError:
        app.logger.warning('APScheduler not installed — scheduler disabled')
    except Exception as e:
        app.logger.error(f'Scheduler error: {e}')


def _expire_subscriptions(app: Flask):
    with app.app_context():
        from app.services.subscription_service import SubscriptionService
        count = SubscriptionService.expire_old_subscriptions()
        app.logger.info(f'Auto-expiry: {count} subscription(s) marked EXPIRED')