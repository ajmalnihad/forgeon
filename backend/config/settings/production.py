"""
Production settings — safe baseline separation.

Deliberately minimal for Stage 1: deployment hardening (static file serving,
logging aggregation, etc.) belongs to Stage 4. DEBUG is forced off and the
basic security headers are enabled.
"""
from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False

# No default: production MUST define its hosts explicitly.
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")

# Baseline security hardening.
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = env.int("DJANGO_SECURE_HSTS_SECONDS", default=3600)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
