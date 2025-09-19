import logging
import sys
import os
from logging.handlers import RotatingFileHandler

logger = logging.getLogger("SupplyChainLogger")

# Create logs directory if it doesn't exist
log_dir = "logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Configure file handler for local logging
file_handler = RotatingFileHandler(
    os.path.join(log_dir, "supply_chain.log"),
    maxBytes=10 * 1024 * 1024,  # 10MB
    backupCount=5,
)
file_formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
file_handler.setFormatter(file_formatter)

# Configure console handler for local logging
console_handler = logging.StreamHandler(sys.stdout)
console_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
console_handler.setFormatter(console_formatter)

# Add handlers to logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

logger.setLevel(logging.INFO)


def log_info(message, extra_data=None, user_id=None, request_id=None):
    # Build context for logging
    context = {}
    if extra_data:
        context.update(extra_data)
    if user_id:
        context["user_id"] = user_id
    if request_id:
        context["request_id"] = request_id

    if context:
        formatted_message = f"{message} | Context: {context}"
        logger.info(formatted_message)
    else:
        logger.info(message)


def log_error(message, error=None, extra_data=None, user_id=None, request_id=None):
    context = {}
    if extra_data:
        context.update(extra_data)
    if user_id:
        context["user_id"] = user_id
    if request_id:
        context["request_id"] = request_id
    if error:
        context["error"] = str(error)

    if context:
        formatted_message = f"{message} | Context: {context}"
        logger.error(formatted_message)
    else:
        logger.error(message)
