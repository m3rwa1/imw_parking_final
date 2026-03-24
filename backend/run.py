import os
from app import create_app

env = os.getenv('FLASK_ENV', 'development')
app = create_app(env)

if __name__ == '__main__':
    host = os.getenv('API_HOST', '0.0.0.0')
    port = int(os.getenv('API_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() in ('1', 'true', 'yes')
    use_reloader = os.getenv('FLASK_USE_RELOADER', 'true').lower() in ('1', 'true', 'yes')
    app.run(
        host=host,
        port=port,
        debug=debug,
        use_reloader=debug and use_reloader,
    )