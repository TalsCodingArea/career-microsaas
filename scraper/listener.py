"""
scraper/listener.py — Listener service

Watches the Telegram jobs channel (TELEGRAM_CHAT_ID_JOBS) for messages
containing URLs and enqueues each URL onto the Redis scraper queue so the
parser service can process it asynchronously.

Queue message schema (JSON):
  {"url": "https://...", "chat_id": "<chat_id_string>"}

Environment variables (loaded from ../.env via env_file in docker-compose):
  TELEGRAM_BOT_TOKEN        Telegram bot API token
  TELEGRAM_CHAT_ID_JOBS     Chat / channel ID to watch for job URLs
  SCRAPER_REDIS_HOST        Redis host (default: redis)
  SCRAPER_REDIS_PORT        Redis port (default: 6379)
  SCRAPER_QUEUE_NAME        Queue name (default: scraper:urls)
  LOG_LEVEL                 Logging level (default: INFO)

Installed at container start (see docker-compose.yml command):
  python-telegram-bot==22.5, redis==5.0.8, python-dotenv==1.1.1
"""

import json
import logging
import os
import re

from dotenv import load_dotenv

load_dotenv()

import redis as redis_mod
from telegram import Update
from telegram.ext import Application, ContextTypes, MessageHandler, filters

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("scraper.listener")

BOT_TOKEN: str = os.environ["TELEGRAM_BOT_TOKEN"]
JOBS_CHAT_ID: int = int(os.environ["TELEGRAM_CHAT_ID_JOBS"])
REDIS_HOST: str = os.getenv("SCRAPER_REDIS_HOST", "redis")
REDIS_PORT: int = int(os.getenv("SCRAPER_REDIS_PORT", "6379"))
QUEUE_NAME: str = os.getenv("SCRAPER_QUEUE_NAME", "scraper:urls")

_URL_RE = re.compile(r"https?://\S+")


def _extract_url(text: str) -> str:
    """Return the first HTTP(S) URL found in text, or empty string."""
    match = _URL_RE.search(text or "")
    return match.group(0) if match else ""


def _get_redis() -> redis_mod.Redis:
    return redis_mod.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming Telegram messages; enqueue any URL found."""
    message = update.message or update.channel_post
    if not message:
        return

    # Only process messages from the configured jobs channel/chat
    if message.chat_id != JOBS_CHAT_ID:
        return

    text = (message.text or message.caption or "").strip()
    url = _extract_url(text)
    if not url:
        return

    payload = json.dumps({"url": url, "chat_id": str(message.chat_id)})
    r = _get_redis()
    r.rpush(QUEUE_NAME, payload)
    logger.info("Enqueued URL: %s → queue '%s'", url, QUEUE_NAME)


def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.ALL, handle_message))
    logger.info(
        "Listener started. Watching chat_id=%s → queue='%s'",
        JOBS_CHAT_ID,
        QUEUE_NAME,
    )
    app.run_polling()


if __name__ == "__main__":
    main()
