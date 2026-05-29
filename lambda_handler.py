import json
import boto3
import re
from datetime import datetime
from urllib.parse import unquote

dynamodb = boto3.resource('dynamodb')
ses_client = boto3.client('ses')
s3_client = boto3.client('s3')

# DynamoDB Tables
subscribers_table = dynamodb.Table('love-and-layovers-subscribers')
contacts_table = dynamodb.Table('love-and-layovers-contacts')

# Configuration
SES_VERIFIED_EMAIL = 'hello@loveandlayovers.com'
S3_BUCKET = 'love-and-layovers-itineraries'
ALLOWED_ORIGINS = ['https://loveandlayovers.com', 'http://localhost:3000']

def validate_email(email):
    """Validate email format"""
    pattern = r'^[^@]+@[^@]+\.[^@]+$'
    return re.match(pattern, email) is not None

def cors_headers(origin='*'):
    """Return CORS headers"""
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
    }

def response(status_code, body, origin='*'):
    """Format Lambda response"""
    return {
        'statusCode': status_code,
        'headers': cors_headers(origin),
        'body': json.dumps(body)
    }

def handle_options(event):
    """Handle CORS preflight requests"""
    return response(200, {'message': 'OK'})

def subscribe(event):
    """Handle email subscriptions"""
    try:
        body = json.loads(event.get('body', '{}'))
        email = body.get('email', '').strip().lower()
        source = body.get('source', 'website')

        if not email or not validate_email(email):
            return response(400, {'success': False, 'message': 'Invalid email address'})

        # Save to DynamoDB
        subscribers_table.put_item(
            Item={
                'email': email,
                'subscribed_at': datetime.utcnow().isoformat(),
                'source': source,
                'status': 'active'
            }
        )

        # Send confirmation email
        ses_client.send_email(
            Source=SES_VERIFIED_EMAIL,
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': 'Welcome to Love and Layovers!'},
                'Body': {
                    'Html': {
                        'Data': f"""
                        <html>
                        <body style="font-family: Arial, sans-serif; color: #1a2332;">
                            <h2>Welcome aboard! 🌍</h2>
                            <p>Hi there!</p>
                            <p>Thanks for subscribing to Love and Layovers. You'll now get:</p>
                            <ul>
                                <li>Free travel itineraries to download</li>
                                <li>New video alerts</li>
                                <li>Behind-the-scenes travel tips</li>
                                <li>Exclusive travel deals we find</li>
                            </ul>
                            <p>Check your inbox for our latest Singapore itinerary!</p>
                            <p>Happy travels,<br>Love and Layovers Team ✈️</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="font-size: 12px; color: #999;">You can unsubscribe anytime by replying with "UNSUBSCRIBE"</p>
                        </body>
                        </html>
                        """
                    }
                }
            }
        )

        return response(200, {'success': True, 'message': 'Subscription successful! Check your email.'})

    except Exception as e:
        print(f"Error in subscribe: {str(e)}")
        return response(500, {'success': False, 'message': 'An error occurred. Please try again.'})

def contact(event):
    """Handle contact form submissions"""
    try:
        body = json.loads(event.get('body', '{}'))
        name = body.get('name', '').strip()
        email = body.get('email', '').strip().lower()
        destination = body.get('destination', '').strip()
        message = body.get('message', '').strip()

        if not all([name, email, message]):
            return response(400, {'success': False, 'message': 'Missing required fields'})

        if not validate_email(email):
            return response(400, {'success': False, 'message': 'Invalid email address'})

        # Save to DynamoDB
        contact_id = f"{email}-{int(datetime.utcnow().timestamp())}"
        contacts_table.put_item(
            Item={
                'contact_id': contact_id,
                'name': name,
                'email': email,
                'destination': destination,
                'message': message,
                'submitted_at': datetime.utcnow().isoformat(),
                'status': 'new'
            }
        )

        # Send to Love and Layovers email
        ses_client.send_email(
            Source=SES_VERIFIED_EMAIL,
            Destination={'ToAddresses': [SES_VERIFIED_EMAIL]},
            Message={
                'Subject': {'Data': f"New Contact: {name} - {destination}"},
                'Body': {
                    'Html': {
                        'Data': f"""
                        <html>
                        <body>
                            <h3>New Contact Form Submission</h3>
                            <p><strong>Name:</strong> {name}</p>
                            <p><strong>Email:</strong> {email}</p>
                            <p><strong>Destination:</strong> {destination or 'Not specified'}</p>
                            <p><strong>Message:</strong></p>
                            <p>{message}</p>
                        </body>
                        </html>
                        """
                    }
                }
            }
        )

        # Send confirmation to user
        ses_client.send_email(
            Source=SES_VERIFIED_EMAIL,
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': 'We got your message!'},
                'Body': {
                    'Html': {
                        'Data': f"""
                        <html>
                        <body style="font-family: Arial, sans-serif; color: #1a2332;">
                            <h2>Thanks {name}!</h2>
                            <p>We received your message about {destination or 'travel planning'}.</p>
                            <p>We read every message and will get back to you soon.</p>
                            <p>In the meantime, check out our latest videos and itineraries!</p>
                            <p>Happy travels,<br>Love and Layovers Team ✈️</p>
                        </body>
                        </html>
                        """
                    }
                }
            }
        )

        return response(200, {'success': True, 'message': 'Thank you! We will reply soon.'})

    except Exception as e:
        print(f"Error in contact: {str(e)}")
        return response(500, {'success': False, 'message': 'An error occurred. Please try again.'})

def download_itinerary(event):
    """Handle itinerary downloads"""
    try:
        body = json.loads(event.get('body', '{}'))
        destination = body.get('destination', '').lower()
        itinerary = body.get('itinerary', '').lower()
        email = body.get('email', '').strip().lower()

        if not validate_email(email):
            return response(400, {'success': False, 'message': 'Invalid email'})

        # Log download
        dynamodb_log = dynamodb.Table('love-and-layovers-downloads')
        dynamodb_log.put_item(
            Item={
                'download_id': f"{email}-{destination}-{itinerary}-{int(datetime.utcnow().timestamp())}",
                'email': email,
                'destination': destination,
                'itinerary': itinerary,
                'downloaded_at': datetime.utcnow().isoformat()
            }
        )

        # Track analytics event
        print(f"Analytics: Itinerary download - {destination}/{itinerary} by {email}")

        # Get PDF from S3
        pdf_key = f"{destination}/{itinerary}.pdf"
        try:
            response_obj = s3_client.get_object(Bucket=S3_BUCKET, Key=pdf_key)
            pdf_content = response_obj['Body'].read()

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': f'attachment; filename="{destination}-{itinerary}.pdf"'
                },
                'body': pdf_content.hex(),
                'isBase64Encoded': True
            }
        except s3_client.exceptions.NoSuchKey:
            return response(404, {'success': False, 'message': 'Itinerary not found'})

    except Exception as e:
        print(f"Error in download_itinerary: {str(e)}")
        return response(500, {'success': False, 'message': 'Download failed. Please try again.'})

def lambda_handler(event, context):
    """Main Lambda handler"""
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    # Handle CORS preflight
    if http_method == 'OPTIONS':
        return handle_options(event)

    # Route requests
    if path == '/subscribe' and http_method == 'POST':
        return subscribe(event)
    elif path == '/contact' and http_method == 'POST':
        return contact(event)
    elif path == '/download-itinerary' and http_method == 'POST':
        return download_itinerary(event)
    else:
        return response(404, {'message': 'Not found'})
