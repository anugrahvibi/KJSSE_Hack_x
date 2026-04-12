from __future__ import annotations
import logging
from twilio.rest import Client
from ..config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_NUMBER, TWILIO_DESTINATION_NUMBER

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self) -> None:
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        from ..config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
            try:
                self.client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                logger.info(f"Twilio client initialized with SID: {TWILIO_ACCOUNT_SID[:5]}...")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
        else:
            logger.warning("Twilio credentials missing in config.")

    def send_sms(self, message: str, to_number: str | None = None) -> bool:
        from ..config import TWILIO_NUMBER, TWILIO_DESTINATION_NUMBER
        target = to_number or TWILIO_DESTINATION_NUMBER
        
        if not self.client:
            self._initialize_client()
        
        if not self.client:
            logger.info(f"[MOCK SMS] To: {target} | Body: {message}")
            return True

        try:
            msg = self.client.messages.create(
                body=message,
                from_=TWILIO_NUMBER,
                to=target
            )
            logger.info(f"SMS sent successfully. SID: {msg.sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS via Twilio: {e}")
            return False

    def trigger_demo_alert(self) -> bool:
        message = (
            "âš ï¸ RIVA CRITICAL ALERT âš ï¸ \n"
            "Demo Scenario Activated: Tidal Lock + Heavy Rainfall.\n"
            "Multiple infrastructure nodes at risk. Immediate action required."
        )
        return self.send_sms(message)
