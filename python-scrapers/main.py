# python-scrapers/main.py
from dotenv import load_dotenv
load_dotenv()

import os
import logging
from google_trends import monitor_keywords

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("scraper-main")

if __name__ == "__main__":
    logger.info("Starting Google Trends Scraper...")

    loop_seconds = int(os.environ.get("SCRAPER_LOOP_SECONDS", "300"))

    # Run the monitor (it loops internally)
    try:
        monitor_keywords(loop_seconds=loop_seconds)
    except KeyboardInterrupt:
        logger.info("Stopped by user")
    except Exception as e:
        logger.exception(f"Monitor crashed: {e}")
