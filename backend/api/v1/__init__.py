# api/v1 — versioned API layer (approved architecture).
#
# This package will own serializers, views and urls for each domain:
#   auth/ customers/ products/ sales/ dashboard/ reports/
#
# Domain apps (apps/*) own models/migrations/admin only.
# Stage 1 creates the package structure; endpoints arrive in Stage 2/3.
# Deliberately NO placeholder/fake endpoints exist here.
