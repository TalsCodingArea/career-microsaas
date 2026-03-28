"""
scraper/parser.py — Parser service

Pops scrape tasks from the Redis queue (SCRAPER_QUEUE_NAME), fetches each URL
using requests + BeautifulSoup (with Playwright fallback for JS-rendered pages),
runs LLM-based structured extraction via the project's _parse_job_with_llm,
then stores the resulting JobData as a Redis hash with a configurable TTL.

Queue/storage schema:
  Input  (SCRAPER_QUEUE_NAME):  {"url": "https://...", ...optional_meta}
  Output (Redis hash):          key = SCRAPER_RESULT_PREFIX + sha256_prefix_16
                                fields = all JobData fields as strings
                                TTL = SCRAPER_RESULT_TTL seconds

Environment variables (loaded from ../.env via env_file in docker-compose):
  SCRAPER_REDIS_HOST          Redis host (default: redis)
  SCRAPER_REDIS_PORT          Redis port (default: 6379)
  SCRAPER_QUEUE_NAME          Queue name (default: scraper:urls)
  SCRAPER_RESULT_PREFIX       Redis key prefix for stored results
                              (default: scraper:result:)
  SCRAPER_RESULT_TTL          Result TTL in seconds (default: 3600)
  SCRAPER_WORKER_CONCURRENCY  Number of concurrent worker threads (default: 2)
  OPENAI_API_KEY              Required for LLM-based job data extraction
  LOG_LEVEL                   Logging level (default: INFO)

Installed at container start (see docker-compose.yml command):
  redis==5.0.8, requests, beautifulsoup4, lxml, playwright, langchain-openai,
  langchain, python-dotenv

The project root is mounted at /app so tools/job_tools.py and agent/llm.py
are importable without re-installing the full requirements.txt.
"""

import hashlib
import json
import logging
import os
import sys
import threading

# Project root is /app (mounted volume — see docker-compose.yml)
sys.path.insert(0, "/app")

from dotenv import load_dotenv

load_dotenv()

import redis as redis_mod

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("scraper.parser")

REDIS_HOST: str = os.getenv("SCRAPER_REDIS_HOST", "redis")
REDIS_PORT: int = int(os.getenv("SCRAPER_REDIS_PORT", "6379"))
QUEUE_NAME: str = os.getenv("SCRAPER_QUEUE_NAME", "scraper:urls")
RESULT_PREFIX: str = os.getenv("SCRAPER_RESULT_PREFIX", "scraper:result:")
RESULT_TTL: int = int(os.getenv("SCRAPER_RESULT_TTL", "3600"))
CONCURRENCY: int = int(os.getenv("SCRAPER_WORKER_CONCURRENCY", "2"))


def _get_redis() -> redis_mod.Redis:
    return redis_mod.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


def _result_key(url: str) -> str:
    return RESULT_PREFIX + hashlib.sha256(url.encode()).hexdigest()[:16]


def _scrape(url: str) -> dict:
    """Two-tier scrape: requests first, Playwright fallback for short results."""
    from tools.job_tools import (  # noqa: PLC0415
        _MIN_USEFUL_TEXT_LENGTH,
        _scrape_with_playwright,
        _scrape_with_requests,
    )
    result = _scrape_with_requests(url)
    if len(result["raw_text"]) < _MIN_USEFUL_TEXT_LENGTH:
        logger.info(
            "requests returned only %d chars for %s — trying Playwright",
            len(result["raw_text"]),
            url,
        )
        playwright_result = _scrape_with_playwright(url)
        if playwright_result and len(playwright_result["raw_text"]) > len(result["raw_text"]):
            return playwright_result
        logger.warning("Playwright did not improve result for %s", url)
    return result


def _parse(raw_data: dict) -> dict:
    """Run LLM-based structured extraction on raw scraped data."""
    from agent.llm import get_llm  # noqa: PLC0415
    from tools.job_tools import _parse_job_with_llm  # noqa: PLC0415
    return _parse_job_with_llm(raw_data, get_llm())


def _store(r: redis_mod.Redis, job_data: dict) -> str:
    """Persist job_data to a Redis hash; return the key used."""
    key = _result_key(job_data.get("url", ""))
    mapping = {
        k: json.dumps(v) if isinstance(v, (dict, list)) else str(v)
        for k, v in job_data.items()
    }
    r.hset(key, mapping=mapping)
    if RESULT_TTL > 0:
        r.expire(key, RESULT_TTL)
    return key


def worker_loop() -> None:
    """Blocking worker: pop → scrape → parse → store, indefinitely."""
    r = _get_redis()
    logger.info("Worker started. Polling queue '%s'...", QUEUE_NAME)
    while True:
        item = r.blpop(QUEUE_NAME, timeout=5)
        if not item:
            continue

        _, payload = item
        try:
            task = json.loads(payload)
        except json.JSONDecodeError:
            logger.warning("Ignoring invalid JSON payload: %.200s", payload)
            continue

        url = task.get("url", "").strip()
        if not url:
            logger.warning("Payload missing 'url': %s", task)
            continue

        logger.info("Processing: %s", url)
        try:
            raw_data = _scrape(url)
            job_data = _parse(raw_data)
            key = _store(r, job_data)
            logger.info(
                "Stored at '%s' — title=%r company=%r method=%s",
                key,
                job_data.get("title"),
                job_data.get("company"),
                raw_data.get("scrape_method"),
            )
        except Exception as exc:
            logger.error("Failed to process %s: %s", url, exc)


def main() -> None:
    threads = [
        threading.Thread(target=worker_loop, daemon=True, name=f"parser-worker-{i}")
        for i in range(CONCURRENCY)
    ]
    for t in threads:
        t.start()
    logger.info("Parser started with %d worker(s).", CONCURRENCY)
    for t in threads:
        t.join()


if __name__ == "__main__":
    main()
