import contextvars
from services.db import active_user_email, _resolve_path, _get_active_user_key

active_user_email.set("test-new4@gmail.com")
print("Key:", _get_active_user_key())
print("Path:", _resolve_path("user.json"))
