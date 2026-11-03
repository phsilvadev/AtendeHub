"""API E2E em banco temporário, sem tocar no banco de desenvolvimento."""
import os
from pathlib import Path
import subprocess
import tempfile
import sys

backend = Path(__file__).resolve().parents[1] / 'backend'
python = backend / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
with tempfile.TemporaryDirectory(prefix='atendehub-e2e-') as directory:
    env = {**os.environ, 'DATABASE_URL': f'sqlite:///{directory}/e2e.db', 'APP_ENV': 'development', 'COOKIE_SECURE': 'false', 'ALLOWED_ORIGINS': '["http://127.0.0.1:3100"]'}
    subprocess.run([str(python), '-m', 'alembic', 'upgrade', 'head'], cwd=backend, env=env, check=True)
    subprocess.run([str(python), '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8100'], cwd=backend, env=env, check=True)
