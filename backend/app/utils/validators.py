"""Input validators for DriveVerse."""
import re


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Validate Indian mobile number format."""
    clean = re.sub(r"[\s\-+]", "", phone)
    # Indian numbers: 10 digits starting with 6-9, or with +91 prefix
    if clean.startswith("91") and len(clean) == 12:
        clean = clean[2:]
    return bool(re.match(r"^[6-9]\d{9}$", clean))


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, message).
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    return True, "Password is strong"


def validate_vehicle_registration(reg_no: str) -> bool:
    """Validate Indian vehicle registration number format."""
    clean = re.sub(r"[\s\-]", "", reg_no).upper()
    # Format: XX00XX0000 or XX00X0000
    pattern = r"^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$"
    return bool(re.match(pattern, clean))


def sanitize_registration_number(reg_no: str) -> str:
    """Clean and standardize vehicle registration number."""
    return re.sub(r"[\s\-]", "", reg_no).upper()
