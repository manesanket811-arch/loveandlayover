# Love and Layovers - AWS Deployment Guide

## Overview
This guide walks you through deploying the Love and Layovers website to AWS with:
- **Static Website**: S3 + CloudFront CDN
- **Backend API**: Lambda + API Gateway
- **Database**: DynamoDB for subscribers, contacts, and downloads
- **Email**: AWS SES for confirmations and notifications
- **Analytics**: Google Analytics (built-in)

---

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **SAM CLI** for deployment
4. **Node.js** (optional, for local testing)

### Install AWS Tools

```bash
# Install AWS CLI
pip install awscli

# Install AWS SAM CLI
pip install aws-sam-cli

# Configure AWS credentials
aws configure
```

---

## Step 1: Prepare AWS SES

AWS SES must verify your email domain before sending.

### Verify Email Address

```bash
aws ses verify-email-identity --email-address hello@loveandlayovers.com --region us-east-1
```

Check your email and click the verification link.

### (Optional) Verify Domain for Production

For production, verify your domain instead of individual emails:

```bash
aws ses verify-domain-identity --domain loveandlayovers.com --region us-east-1
```

Add the CNAME records to your DNS (AWS will provide them).

### Move Out of Sandbox (Production Access)

By default, SES is in sandbox mode. Request production access:
1. Go to AWS SES Console → Sending Statistics
2. Click "Request Production Access"
3. Fill the form and submit

---

## Step 2: Deploy Infrastructure with SAM

### Update template.yaml

Replace email addresses and bucket names in `template.yaml` if needed.

### Deploy

```bash
# Build SAM project
sam build

# Deploy (first time - interactive)
sam deploy --guided

# Enter these details:
# Stack Name: love-and-layovers-stack
# Region: us-east-1 (or your preferred region)
# Confirm changes: Y
# SAM CLI IAM role creation: Y
# Confirm each policy: Y
```

### Redeploy (after first time)

```bash
sam deploy
```

### Save Outputs

After deployment, save these from the CloudFormation outputs:
- **API Endpoint**: (replace in index.html)
- **Website URL**: (your CloudFront domain)
- **S3 Bucket Names**: For uploading website and itineraries

---

## Step 3: Upload Website to S3

```bash
# Get website bucket name from CloudFormation outputs
WEBSITE_BUCKET="love-and-layovers-website-XXXXXXXXXXXX"

# Upload index.html and all assets
aws s3 cp index.html s3://$WEBSITE_BUCKET/
aws s3 cp . s3://$WEBSITE_BUCKET/ --recursive --exclude ".git/*" --exclude "*.md" --exclude "*.py" --exclude "*.yaml"
```

---

## Step 4: Update index.html with API Endpoint

In `index.html`, replace the API endpoint:

```javascript
const API_ENDPOINT = 'https://YOUR_API_GATEWAY_URL/Prod';
```

Upload updated file:

```bash
aws s3 cp index.html s3://$WEBSITE_BUCKET/
```

---

## Step 5: Update Google Analytics ID

1. Create Google Analytics property at [analytics.google.com](https://analytics.google.com)
2. Get your Measurement ID (format: G-XXXXXXXXXX)
3. Update in `index.html`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

4. Upload updated file to S3

---

## Step 6: Create Itinerary PDFs

### Prepare PDFs

Create PDF files for each itinerary:
- `singapore-food-culture.pdf`
- `singapore-gardens-nature.pdf`
- `singapore-city-explorer.pdf`

### Upload to S3

```bash
ITINERARY_BUCKET="love-and-layovers-itineraries-XXXXXXXXXXXX"

# Create folder structure
aws s3api put-object --bucket $ITINERARY_BUCKET --key singapore/ --body /dev/null

# Upload PDFs
aws s3 cp singapore-food-culture.pdf s3://$ITINERARY_BUCKET/singapore/
aws s3 cp singapore-gardens-nature.pdf s3://$ITINERARY_BUCKET/singapore/
aws s3 cp singapore-city-explorer.pdf s3://$ITINERARY_BUCKET/singapore/
```

---

## Step 7: Enable CORS for API

The API now supports CORS. Make sure your website domain is allowed.

For production, update the `ALLOWED_ORIGINS` in `lambda_handler.py`:

```python
ALLOWED_ORIGINS = ['https://loveandlayovers.com', 'https://www.loveandlayovers.com']
```

Then redeploy:
```bash
sam build && sam deploy
```

---

## Step 8: Connect Custom Domain (Optional)

### Register Domain
- Use Route 53, GoDaddy, or Namecheap

### Point to CloudFront
1. Get CloudFront Domain: `dXXXXXXXXXXXXXX.cloudfront.net`
2. Create CNAME record:
   - Name: `loveandlayovers.com`
   - Value: CloudFront domain
3. Wait for DNS propagation (5-30 minutes)

### Use Custom Domain in CloudFront
1. Go to CloudFront Distribution settings
2. Add "Alternate Domain Names": `loveandlayovers.com`, `www.loveandlayovers.com`
3. Use ACM certificate for HTTPS

---

## Step 9: Testing

### Test Subscription
```bash
curl -X POST https://YOUR_API_ENDPOINT/Prod/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","source":"test"}'
```

### Test Contact Form
```bash
curl -X POST https://YOUR_API_ENDPOINT/Prod/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Traveler",
    "email":"john@example.com",
    "destination":"Singapore",
    "message":"Great tips!"
  }'
```

### Test Itinerary Download
```bash
curl -X POST https://YOUR_API_ENDPOINT/Prod/download-itinerary \
  -H "Content-Type: application/json" \
  -d '{
    "destination":"singapore",
    "itinerary":"food-culture",
    "email":"test@example.com"
  }'
```

---

## Monitoring & Analytics

### View Logs
```bash
sam logs -n APIFunction --stack-name love-and-layovers-stack -t
```

### DynamoDB Monitoring
1. Go to AWS DynamoDB Console
2. Select tables: `love-and-layovers-subscribers`, `love-and-layovers-contacts`, etc.
3. View metrics and items

### Google Analytics
- Visit [analytics.google.com](https://analytics.google.com)
- Track real-time visitors, events, downloads

---

## Cost Optimization Tips

1. **DynamoDB**: On-demand billing is fine for now
2. **Lambda**: 1 million free requests/month
3. **S3**: Free tier includes 5 GB storage
4. **SES**: $0.10 per 1,000 emails (first 200/day free)
5. **CloudFront**: $0.085/GB for first 10TB/month

**Estimated monthly cost**: $5-20 (very affordable!)

---

## Updating Content

### Update Website
```bash
# Edit index.html locally, then upload
aws s3 cp index.html s3://$WEBSITE_BUCKET/
# CloudFront invalidation (optional, for instant updates)
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Add New Destination
1. Create PDF itinerary
2. Upload to S3: `s3://bucket/destination/itinerary-name.pdf`
3. Update `index.html` with new cards
4. Upload updated HTML

### View Subscriber List
```bash
aws dynamodb scan --table-name love-and-layovers-subscribers --region us-east-1
```

---

## Troubleshooting

### API Returns 500 Error
Check Lambda logs:
```bash
sam logs -n APIFunction --stack-name love-and-layovers-stack
```

### Email Not Sending
- Verify email in SES console
- Check SES is not in sandbox mode
- Verify `hello@loveandlayovers.com` in SES

### Files Not Uploading to S3
```bash
# Check bucket permissions
aws s3 ls s3://$WEBSITE_BUCKET/

# Upload with verbose output
aws s3 cp index.html s3://$WEBSITE_BUCKET/ --debug
```

### CloudFront Not Showing Updates
Create invalidation:
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Next Steps

1. **Set up YouTube Integration**: Fetch latest videos via YouTube Data API
2. **Add Blog**: Store blog posts in DynamoDB
3. **Email Campaigns**: Use SES templates for newsletters
4. **Analytics Dashboard**: Build dashboard with QuickSight
5. **Mobile App**: Build with React Native

---

## Support

For AWS help:
- [AWS Console](https://console.aws.amazon.com)
- [AWS Documentation](https://docs.aws.amazon.com)
- [AWS Support Center](https://console.aws.amazon.com/support)

Happy travels! ✈️
