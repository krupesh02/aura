import os
import httpx
import logging

logger = logging.getLogger(__name__)

async def send_whatsapp_message(to_number: str, message: str):
    """
    Send a WhatsApp message using Twilio if credentials exist, 
    otherwise logs the message for local development.
    """
    if not to_number:
        logger.warning("No phone number provided for WhatsApp notification.")
        return False
        
    # Ensure number has country code (India +91)
    if not to_number.startswith("+"):
        to_number = f"+91{to_number}"

    # Get credentials from environment
    TWILIO_SID = os.getenv("TWILIO_SID")
    TWILIO_TOKEN = os.getenv("TWILIO_TOKEN")
    TWILIO_FROM = os.getenv("TWILIO_WHATSAPP_FROM")
    
    CALLMEBOT_API_KEY = os.getenv("CALLMEBOT_API_KEY")

    async with httpx.AsyncClient() as client:
        # Option 1: Twilio
        if TWILIO_SID and TWILIO_TOKEN and TWILIO_FROM:
            logger.info(f"Sending via Twilio to {to_number}")
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json"
            data = {"From": TWILIO_FROM, "To": f"whatsapp:{to_number}", "Body": message}
            try:
                response = await client.post(url, data=data, auth=(TWILIO_SID, TWILIO_TOKEN))
                if response.status_code in [200, 201]: return True
                logger.error(f"Twilio Error: {response.text}")
            except Exception as e: logger.error(f"Twilio Connect Error: {str(e)}")

        # Option 2: CallMeBot (Free)
        elif CALLMEBOT_API_KEY:
            logger.info(f"Sending via CallMeBot to {to_number}")
            # Clean number for CallMeBot (no +)
            clean_num = to_number.replace("+", "")
            url = f"https://api.callmebot.com/whatsapp.php?phone={clean_num}&text={message.replace(' ', '+')}&apikey={CALLMEBOT_API_KEY}"
            try:
                response = await client.get(url)
                if response.status_code == 200: return True
                logger.error(f"CallMeBot Error: {response.text}")
            except Exception as e: logger.error(f"CallMeBot Connect Error: {str(e)}")

    # Mock mode fallback
    logger.info("--------------------------------------------------")
    logger.info(f"MOCK WHATSAPP NOTIFICATION (No API keys found)")
    logger.info(f"To: {to_number}")
    logger.info(f"Message: {message}")
    logger.info("--------------------------------------------------")
    return True

async def notify_photographer_payment(photographer_number: str, event_name: str, amount: float, guest_name: str = "A guest"):
    """
    Format and send a payment notification to the photographer.
    """
    if not guest_name:
        guest_name = "A guest"
        
    message = (
        f"🎉 *New Payment Received!*\n\n"
        f"Event: {event_name}\n"
        f"Amount: ₹{amount}\n"
        f"Guest: {guest_name}\n\n"
        f"They now have access to download their high-quality photos. "
        f"Check your dashboard for details."
    )
    
    return await send_whatsapp_message(photographer_number, message)
