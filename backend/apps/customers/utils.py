"""
Opaque customer display-code generation.

Codes look like `FO-A901` / `FO-K7M2`:
- prefix "FO-"
- 4 cryptographically random uppercase alphanumeric characters
- non-sequential — reveals neither registration order nor customer count
- immutable after creation (never regenerated on edit)

This helper is deliberately simple; uniqueness is ultimately enforced by the
database UNIQUE constraint on `Customer.code`. Client-provided codes must
NEVER be trusted by the future API layer.
"""
import secrets

CODE_PREFIX = "FO-"
# Omit ambiguous characters (I, O, 0, 1) to ensure readability of display codes.
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_RANDOM_LENGTH = 4
_MAX_ATTEMPTS = 25


def generate_customer_code() -> str:
    """Return one random opaque code candidate, e.g. 'FO-A901'."""
    random_part = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_RANDOM_LENGTH))
    return f"{CODE_PREFIX}{random_part}"


def generate_unique_customer_code() -> str:
    """
    Return a code not currently present in the customers table.

    36^4 = 1,679,616 combinations against ~100 customers, so collisions are
    rare; the retry loop plus the DB unique constraint make it safe. Imported
    lazily to avoid an import cycle with models.py.
    """
    from .models import Customer

    for _ in range(_MAX_ATTEMPTS):
        code = generate_customer_code()
        if not Customer.objects.filter(code=code).exists():
            return code
    raise RuntimeError("Unable to generate a unique customer code; retry.")
