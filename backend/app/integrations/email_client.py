"""Email client for OTP delivery via SMTP."""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings

logger = logging.getLogger("driveverse.integrations.email")


async def send_otp_email(to_email: str, otp: str) -> bool:
    """Send OTP verification email via SMTP."""
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
        logger.warning(
            f"SMTP not configured. OTP for {to_email}: {otp}. "
            f"Configure SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD in .env"
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "DriveVerse — Verification Code"
        msg["From"] = settings.SMTP_SENDER
        msg["To"] = to_email

        html = f"""
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0c10; color: #f0f2f5; padding: 40px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-size: 24px;">🚗</div>
                <h1 style="font-size: 24px; font-weight: 700; margin: 16px 0 4px; background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">DriveVerse</h1>
                <p style="color: #8e95a5; font-size: 14px;">One Identity. Every Vehicle Service.</p>
            </div>
            <p style="color: #c4c9d4; font-size: 15px;">Your verification code is:</p>
            <div style="font-size: 36px; font-weight: 700; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 20px; text-align: center; border-radius: 12px; color: #818cf8; letter-spacing: 8px; margin: 24px 0;">
                {otp}
            </div>
            <p style="color: #6b7280; font-size: 13px; text-align: center;">This code expires in 5 minutes. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0;">
            <p style="color: #4b5563; font-size: 12px; text-align: center;">© 2026 DriveVerse. All rights reserved.</p>
        </div>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_SENDER, [to_email], msg.as_string())

        logger.info(f"OTP email sent to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send OTP email: {e}")
        return False
