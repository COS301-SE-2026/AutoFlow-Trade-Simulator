# Auth Overview

The repo keeps auth as a small JWT helper first.

What it does:
- Creates access tokens
- Decodes access tokens
- Keeps secrets in environment variables

Where it lives:
- Auth helper: `backend/app/security.py`
- Secrets and token settings: `backend/app/settings.py`
- Auth endpoints can live inside an Epic controller when you add login/logout flows

Smallest example:
- Create a token with `create_access_token`
- Decode it with `decode_access_token`
