# python-scrapers/google_trends.py
import time
import logging
import os
import uuid
import random
from datetime import datetime, timezone
from typing import List, Dict
from pytrends.request import TrendReq
import psycopg2
from psycopg2.extras import execute_values, RealDictCursor

# Setup logging
logger = logging.getLogger("google_trends")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Environment variables
DB_URL = os.environ.get("PYTHON_DATABASE_URL") or os.environ.get("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("Database URL not set. Set PYTHON_DATABASE_URL or DATABASE_URL.")

def get_db_conn():
    """Create and return a database connection."""
    return psycopg2.connect(DB_URL)

def build_pytrend():
    """Create a fresh pytrends session to avoid Google soft-blocking."""
    return TrendReq(
        hl="en-US",
        tz=0,
        timeout=(10, 30),
        retries=5,
        backoff_factor=1.0,
        requests_args={
            'headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }
    )

def fetch_interest_over_time(pytrends: TrendReq, keyword: str) -> List[tuple]:
    """
    Fetch Google Trends data for a keyword.
    Returns list of (timestamp, value) tuples.
    """
    max_attempts = 3
    base_delay = 3.0

    for attempt in range(1, max_attempts + 1):
        try:
            logger.info(f"Fetching '{keyword}' (attempt {attempt}/{max_attempts})")

            # Build payload and fetch data
            pytrends.build_payload([keyword], timeframe="now 4-H", geo="US")
            data = pytrends.interest_over_time()

            if data.empty:
                logger.warning(f"No data returned for '{keyword}'")
                return []

            # Remove 'isPartial' column if exists
            if 'isPartial' in data.columns:
                data = data.drop(columns=['isPartial'])

            # Extract timestamp and value pairs
            rows = []
            for ts, row in data.iterrows():
                value = int(row[keyword])
                timestamp = ts.replace(tzinfo=timezone.utc).isoformat()
                rows.append((timestamp, value))

            logger.info(f"SUCCESS: Fetched {len(rows)} data points for '{keyword}'")
            return rows

        except Exception as e:
            error_msg = str(e)
            
            if "429" in error_msg or "Too Many Requests" in error_msg:
                # Exponential backoff for rate limiting
                sleep_time = (base_delay * (2 ** attempt)) + random.uniform(0.5, 2.0)
                logger.warning(f"Rate limited! Backing off {sleep_time:.2f}s...")
                time.sleep(sleep_time)
            else:
                logger.error(f"ERROR: Fetching '{keyword}': {error_msg}")
                if attempt < max_attempts:
                    sleep_time = base_delay * attempt
                    time.sleep(sleep_time)

    logger.error(f"FAILED: Could not fetch '{keyword}' after {max_attempts} attempts.")
    return []

def save_trend_data(conn, keyword_id: str, rows: List[tuple]) -> int:
    """
    Insert trend data into database.
    Returns number of records inserted.
    """
    if not rows:
        return 0

    try:
        with conn.cursor() as cur:
            insert_rows = [
                (str(uuid.uuid4()), keyword_id, ts, v, datetime.now(timezone.utc))
                for (ts, v) in rows
            ]

            # Try with ON CONFLICT first
            try:
                execute_values(
                    cur,
                    """
                    INSERT INTO "TrendData" ("id", "keywordId", "timestamp", "value", "createdAt")
                    VALUES %s
                    ON CONFLICT ("keywordId", "timestamp") DO NOTHING
                    """,
                    insert_rows
                )
            except psycopg2.errors.InvalidColumnReference:
                # Fallback: No unique constraint exists yet
                logger.warning("Unique constraint missing. Inserting without ON CONFLICT.")
                execute_values(
                    cur,
                    """
                    INSERT INTO "TrendData" ("id", "keywordId", "timestamp", "value", "createdAt")
                    VALUES %s
                    """,
                    insert_rows
                )

        conn.commit()
        logger.info(f"SAVED: Inserted {len(insert_rows)} records into TrendData")
        return len(insert_rows)

    except Exception as e:
        logger.exception(f"ERROR: save_trend_data: {e}")
        conn.rollback()
        return 0

def fetch_active_keywords(conn, limit: int = 50) -> List[Dict]:
    """
    Fetch active keywords from database.
    Returns list of dicts with 'id' and 'term' keys.
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT "id", "term"
                FROM "Keyword"
                WHERE "active" = true
                ORDER BY "createdAt" DESC
                LIMIT %s
                """,
                (limit,),
            )
            return cur.fetchall()
    except Exception as e:
        logger.error(f"Database error fetching keywords: {e}")
        return []

def monitor_keywords(loop_seconds: int = 300, batch_limit: int = 50):
    """
    Main monitoring loop that continuously fetches trend data.
    
    Args:
        loop_seconds: Seconds to wait between full cycles (default: 300 = 5 minutes)
        batch_limit: Max number of keywords to process per cycle (default: 50)
    """
    conn = get_db_conn()
    cycle_count = 0

    try:
        while True:
            # Fetch fresh keywords each cycle (auto-detects new alerts)
            keywords = fetch_active_keywords(conn, limit=batch_limit)
            
            if not keywords:
                logger.warning("No active keywords found. Waiting 60s before retry...")
                time.sleep(60)
                continue

            cycle_count += 1
            logger.info(f"\n{'='*60}")
            logger.info(f"CYCLE #{cycle_count} - Processing {len(keywords)} keywords")
            logger.info(f"{'='*60}\n")

            # Create one pytrends session per cycle
            pytrends = build_pytrend()
            
            # Process each keyword
            for idx, kw in enumerate(keywords, 1):
                term = kw["term"]
                keyword_id = kw["id"]

                logger.info(f"[{idx}/{len(keywords)}] Processing: {term}")

                # Fetch and save trend data
                rows = fetch_interest_over_time(pytrends, term)
                if rows:
                    saved = save_trend_data(conn, keyword_id, rows)
                    if saved == 0:
                        logger.warning(f"WARNING: No data saved for '{term}'")
                else:
                    logger.warning(f"WARNING: No data fetched for '{term}'")

                # Sleep between keywords to avoid rate limiting
                if idx < len(keywords):
                    wait = random.uniform(15, 25)
                    logger.info(f"Sleeping {wait:.2f}s before next keyword...\n")
                    time.sleep(wait)

            # Cycle complete - sleep before next cycle
            logger.info(f"\n{'='*60}")
            logger.info(f"COMPLETE: Cycle #{cycle_count} finished!")
            logger.info(f"Sleeping {loop_seconds}s before next cycle...")
            logger.info(f"{'='*60}\n")
            time.sleep(loop_seconds)

    except KeyboardInterrupt:
        logger.info("\nShutting down gracefully...")
    except Exception as e:
        logger.exception(f"Fatal error in monitor loop: {e}")
    finally:
        conn.close()
        logger.info("Database connection closed")
