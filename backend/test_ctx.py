import contextvars
from services.db import active_user_email, read_json

active_user_email.set("test-new4@gmail.com")
print(active_user_email.get())
