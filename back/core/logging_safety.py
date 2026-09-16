"""Redact credentials before any application or HTTP-client log handler sees them."""
import logging
import os
import re
import traceback
from urllib.parse import quote, quote_plus, unquote, urlsplit

_INSTALLED = False


def redact_secrets(value: str) -> str:
    text = str(value)
    secrets = set()
    for name, secret in os.environ.items():
        if not secret or not (name.endswith(("_KEY", "_SECRET", "_TOKEN")) or name in {"DATABASE_URL", "DIRECT_URL"}):
            continue
        secrets.add(secret)
        secrets.add(unquote(secret))
        if name in {"DATABASE_URL", "DIRECT_URL"}:
            try:
                password = urlsplit(secret).password
                if password:
                    secrets.update((password, unquote(password)))
            except ValueError:
                pass
    variants = set(secrets)
    for secret in secrets:
        for encoder in (quote, quote_plus):
            encoded = encoder(secret, safe="")
            variants.update((encoded, encoder(encoded, safe="")))
    for secret in sorted(variants, key=len, reverse=True):
        if secret:
            text = text.replace(secret, "[REDACTED]")
    # Never retain outgoing URL queries, even for credentials unknown to this process.
    text = re.sub(r'(https?://[^\s?\'"<>]+)\?[^\s\'"<>]+', r'\1?[REDACTED]', text)
    text = re.sub(r'postgres(?:ql)?(?:\+\w+)?://[^\s\'"<>]+', '[REDACTED_DATABASE_URL]', text)
    text = re.sub(
        r'''(?i)((?:servicekey|api[_-]?key|access_token|refresh_token|password|jwt_secret)\s*["']?\s*[:=]\s*["']?)[^&\s"',}\)]+''',
        r'\1[REDACTED]', text,
    )
    text = re.sub(r'(?i)(Bearer|KakaoAK)\s+[^\s\'"<>]+', r'\1 [REDACTED]', text)
    return re.sub(r'\bsk-[A-Za-z0-9_-]+', '[REDACTED_API_KEY]', text)


def install_secret_redaction() -> None:
    """Cover root, uvicorn, requests/urllib3 and httpx/OpenAI log records, including tracebacks."""
    global _INSTALLED
    if _INSTALLED:
        return
    previous_factory = logging.getLogRecordFactory()

    def safe_argument(value):
        if isinstance(value, str):
            return redact_secrets(value)
        if isinstance(value, dict):
            return {key: safe_argument(item) for key, item in value.items()}
        if isinstance(value, tuple):
            return tuple(safe_argument(item) for item in value)
        if isinstance(value, list):
            return [safe_argument(item) for item in value]
        if value is None or isinstance(value, (int, float, bool)):
            return value
        return redact_secrets(str(value))

    def safe_factory(*args, **kwargs):
        record = previous_factory(*args, **kwargs)
        record.msg = redact_secrets(str(record.msg))
        # Uvicorn's access formatter unpacks args; preserve their shape and types.
        record.args = safe_argument(record.args)
        if record.exc_info:
            record.exc_text = redact_secrets(''.join(traceback.format_exception(*record.exc_info)))
            record.exc_info = None
        if record.stack_info:
            record.stack_info = redact_secrets(record.stack_info)
        return record

    logging.setLogRecordFactory(safe_factory)
    _INSTALLED = True
