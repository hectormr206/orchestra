---
name: messaging
description: >
  Messaging patterns: Email, SMS, push notifications, in-app messaging,
  message queues, delivery reliability, templates, unsubscribe management.
  Trigger: When implementing notifications, emails, or messaging systems.

license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Send email"
    - "Send SMS"
    - "Push notification"
    - "Notification system"
    - "Email templates"
    - "Message queue"
allowed-tools: [Read, Write, Edit, Grep, Bash]
---

# Skill: Messaging

> **Patrones de mensajería** - Email, SMS, push notifications, colas de mensajes y sistemas de notificación confiables.

---

## When to Use

- Enviando emails (transaccionales, marketing)
- Implementando notificaciones push (mobile, web)
- Enviando SMS (verificación, alertas)
- Construyendo sistemas de mensajería in-app
- Implementando colas de mensajes (RabbitMQ, SQS)
- Manejando plantillas de mensajería
- Gestión de suscripciones y opt-out

---

## Critical Patterns

### > **ALWAYS**

1. **Usar proveedores confiables**
   ```python
   # Email: SendGrid, AWS SES, Mailgun
   # SMS: Twilio, AWS SNS
   # Push: Firebase Cloud Messaging, OneSignal

   # Nunca implementar SMTP desde cero en producción
   # Usar servicios con alta disponibilidad
   ```

2. **Manejar fallos de entrega**
   ```python
   def send_with_retry(message, max_retries=3):
       for attempt in range(max_retries):
           try:
               return provider.send(message)
           except TemporaryFailure:
               if attempt < max_retries - 1:
                   sleep(2 ** attempt)  # Exponential backoff
                   continue
               raise
       # Log failed delivery for later retry
       log_failed_delivery(message)
   ```

3. **Respetar preferencias de usuario**
   ```python
   def send_notification(user, message):
       # Verificar preferencias
       if not user.notifications_enabled:
           return

       # Verificar canal preferido
       if user.preferred_channel == 'email':
           send_email(user.email, message)
       elif user.preferred_channel == 'push':
           send_push(user.device_id, message)
   ```

4. **Incluir link de unsuscribe obligatorio**
   ```python
   def send_marketing_email(user, template):
       unsubscribe_url = generate_unsubscribe_url(user.id)

       email = render_template(template, {
           'user': user,
           'unsubscribe_link': unsubscribe_url  # OBLIGATORIO
       })

       send_email(user.email, email)
   ```

5. **Usar colas para envíos asíncronos**
   ```python
   # NUNCA enviar emails sincrónicamente en request HTTP
   def queue_email(to, subject, body):
       message_queue.enqueue({
           'to': to,
           'subject': subject,
           'body': body,
           'created_at': datetime.utcnow()
       })
   # Worker procesa la cola en background
   ```

### > **NEVER**

1. **NUNCA** enviar passwords o datos sensibles por email/SMS
2. **NUNCA** ignorar pedidos de unsubscribe (es ilegal)
3. **NUNCA** enviar emails sincrónicamente en request HTTP
4. **NUNCA** hardcodear credenciales de API de messaging
5. **NUNCA** olvidar rate limiting (APIs tienen límites)

---

## Commands and Tools

```bash
# SendGrid CLI
sendgrid send --to user@example.com --subject "Test" --text "Body"

# Twilio CLI
twilio api:core:messages:create --from "+1234567890" --to "+0987654321" --body "Test"

# AWS SES (AWS CLI)
aws ses send-email --to user@example.com --message "Subject:Test\nBody:Test"

# Test email locally
mailhog  # Run SMTP server for testing on port 1025

# Verify TXT records (email deliverability)
dig TXT _dmarc.example.com
dig TXT default._domainkey.example.com
```

---

## Related Skills

- **security** - Data encryption, secure API keys
- **compliance** - GDPR/CCPA consent, unsubscribe laws
- **observability** - Logging message delivery
- **error-handling** - Retry logic, circuit breakers
- **performance** - Queue management, batch sending
- **testing** - Email testing, SMS sandbox

---

## Examples

### Example 1: Transactional Email System

**User request:** "Implement email verification system"

**Implementation:**

```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os

class EmailService:
    def __init__(self):
        self.client = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        self.from_email = 'noreply@example.com'

    def send_verification_email(self, user, verification_token):
        """Send email verification link"""
        verification_url = f"https://example.com/verify?token={verification_token}"

        message = Mail(
            from_email=self.from_email,
            to_emails=user.email,
            subject='Verify your email address',
            html_content=f"""
                <h1>Welcome to Example App!</h1>
                <p>Please verify your email by clicking:</p>
                <a href="{verification_url}">Verify Email</a>
                <p>This link expires in 24 hours.</p>
            """)

        try:
            response = self.client.send(message)
            return response.status_code == 202
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
            return False

    def send_password_reset(self, user, reset_token):
        """Send password reset link"""
        reset_url = f"https://example.com/reset?token={reset_token}"

        message = Mail(
            from_email=self.from_email,
            to_emails=user.email,
            subject='Reset your password',
            html_content=f"""
                <h1>Password Reset</h1>
                <p>Click to reset your password:</p>
                <a href="{reset_url}">Reset Password</a>
                <p>This link expires in 1 hour.</p>
                <p>If you didn't request this, ignore this email.</p>
            """)

        try:
            response = self.client.send(message)
            return response.status_code == 202
        except Exception as e:
            logger.error(f"Failed to send password reset: {e}")
            return False

    def send_marketing_email(self, user, campaign_id, template_data):
        """Send marketing email (with unsubscribe)"""
        # Verificar opt-in
        if not user.marketing_consent:
            logger.info(f"User {user.id} opted out of marketing")
            return False

        unsubscribe_url = f"https://example.com/unsubscribe?user={user.id}&campaign={campaign_id}"

        message = Mail(
            from_email='news@example.com',
            to_emails=user.email,
            subject='Special Offer Just for You!',
            html_content=f"""
                <h1>Exclusive Deal Inside!</h1>
                {render_template(template_data)}
                <hr>
                <small>
                    <a href="{unsubscribe_url}">Unsubscribe</a>
                </small>
            """)

        try:
            response = self.client.send(message)
            return response.status_code == 202
        except Exception as e:
            logger.error(f"Failed to send marketing email: {e}")
            return False
```

### Example 2: SMS Verification with Twilio

**User request:** "Add phone verification with SMS"

**Implementation:**

```python
from twilio.rest import Client
import os

class SMSService:
    def __init__(self):
        self.client = Client(
            os.getenv('TWILIO_ACCOUNT_SID'),
            os.getenv('TWILIO_AUTH_TOKEN')
        )
        self.from_number = os.getenv('TWILIO_PHONE_NUMBER')

    def send_verification_code(self, phone_number, code):
        """Send 6-digit verification code via SMS"""
        message = self.client.messages.create(
            body=f"Your verification code is: {code}\nValid for 10 minutes.",
            from_=self.from_number,
            to=phone_number
        )

        logger.info(f"SMS sent to {phone_number}: SID {message.sid}")
        return message.sid

    def send_alert(self, phone_number, alert_type, details):
        """Send security or system alert"""
        messages = {
            'login_attempt': f"New login detected to your account. If this wasn't you, secure your account immediately.",
            'password_changed': f"Your password was changed. If this wasn't you, contact support immediately.",
            'suspicious_activity': f"Suspicious activity detected on your account. Please review recent activity."
        }

        message = self.client.messages.create(
            body=f"Alert: {messages.get(alert_type, 'Security alert')}\n\n{details}",
            from_=self.from_number,
            to=phone_number
        )

        return message.sid
```

### Example 3: Push Notifications with Firebase

**User request:** "Implement push notifications for mobile app"

**Implementation:**

```python
from firebase_admin import messaging
import firebase_admin
from typing import List

class PushNotificationService:
    def __init__(self):
        if not firebase_admin._apps:
            firebase_admin.initialize_app()

    def send_push(self, device_token: str, title: str, body: str, data: dict = None):
        """Send push notification to a single device"""
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            token=device_token
        )

        try:
            response = messaging.send(message)
            logger.info(f"Push sent: {response}")
            return response
        except messaging.InvalidArgumentError as e:
            logger.error(f"Invalid token: {e}")
            return None
        except messaging.UnregisteredError:
            logger.warning(f"Device unregistered: {device_token}")
            # Remove invalid token from database
            remove_device_token(device_token)
            return None

    def send_to_topic(self, topic: str, title: str, body: str):
        """Send push notification to all devices subscribed to topic"""
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            topic=topic
        )

        try:
            response = messaging.send(message)
            logger.info(f"Push sent to topic {topic}: {response}")
            return response
        except Exception as e:
            logger.error(f"Failed to send to topic: {e}")
            return None

    def send_multicast(self, device_tokens: List[str], title: str, body: str):
        """Send push notification to multiple devices"""
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            tokens=device_tokens
        )

        try:
            response = messaging.send_multicast(message)

            if response.failure_count > 0:
                failed_tokens = []
                for idx, result in enumerate(response.responses):
                    if not result.success:
                        failed_tokens.append(device_tokens[idx])

                # Remove failed tokens
                remove_device_tokens(failed_tokens)

            logger.info(f"Multicast: {response.success_count} sent, {response.failure_count} failed")
            return response
        except Exception as e:
            logger.error(f"Multicast failed: {e}")
            return None
```

### Example 4: Message Queue with Redis + Worker

**User request:** "Implement queue for sending emails asynchronously"

**Implementation:**

```python
import redis
import json
import time
from rq import Queue, Worker
from worker import send_email_task

# Redis connection
redis_conn = redis.Redis(host='localhost', port=6379, db=0)

# Create queues
email_queue = Queue('emails', connection=redis_conn)
sms_queue = Queue('sms', connection=redis_conn)
push_queue = Queue('push', connection=redis_conn)

# Enqueue email
def queue_email(to, subject, body, template_name=None, template_data=None):
    """Queue email for background processing"""
    job = email_queue.enqueue(
        send_email_task,
        args=[to, subject, body],
        kwargs={'template': template_name, 'data': template_data},
        timeout=60,
        result_ttl=86400  # Keep result for 24 hours
    )

    logger.info(f"Email queued: {job.id}")
    return job

# Worker (run separately)
if __name__ == '__main__':
    with redis_conn:
        # Create worker for email queue
        worker = Worker([email_queue], connection=redis_conn)
        worker.work(with_scheduler=True)
```

**Worker process:**

```python
# worker.py
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os

def send_email_task(to, subject, body, template=None, data=None):
    """Worker task to send email"""
    client = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))

    if template:
        # Render template
        body = render_template(template, data)

    message = Mail(
        from_email='noreply@example.com',
        to_emails=to,
        subject=subject,
        html_content=body
    )

    try:
        response = client.send(message)
        if response.status_code == 202:
            logger.info(f"Email sent successfully to {to}")
            return {'success': True, 'message_id': response.headers['X-Message-ID']}
        else:
            logger.error(f"Failed to send: {response.status_code}")
            return {'success': False, 'error': response.status_code}
    except Exception as e:
        logger.error(f"Email error: {e}")
        raise  # RQ will retry based on settings
```

**Benefits:**
- ✅ Emails sent asynchronously (no blocking)
- ✅ Automatic retries on failure
- ✅ Rate limiting handled by queue
- ✅ Workers can scale independently
- ✅ Dead letter queue for failed jobs

---

**EOF**
