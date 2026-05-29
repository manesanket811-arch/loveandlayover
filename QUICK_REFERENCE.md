# Love and Layovers - Quick Reference Guide

Fast commands for managing your website after deployment.

---

## 📊 View Analytics

### Real-time Traffic
```bash
# View real-time Lambda logs
sam logs -n APIFunction --stack-name love-and-layovers-stack -t

# Or in AWS Console
# → CloudWatch → Logs → /aws/lambda/love-and-layovers-api
```

### Subscribers
```bash
# Count total subscribers
aws dynamodb scan --table-name love-and-layovers-subscribers \
  --select COUNT

# List recent subscribers
aws dynamodb scan --table-name love-and-layovers-subscribers \
  --limit 10
```

### Downloads
```bash
# See download analytics
aws dynamodb scan --table-name love-and-layovers-downloads
```

---

## 🌐 Update Website Content

### Update Homepage
```bash
# Edit index.html
nano index.html

# Upload to S3
WEBSITE_BUCKET="love-and-layovers-website-XXXXXXXXXXXX"
aws s3 cp index.html s3://$WEBSITE_BUCKET/

# Invalidate CloudFront cache (optional, for instant update)
DIST_ID="E1ABCDEFG123"
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

### Add New Destination

1. **Create HTML card** in index.html:
```html
<a class="gcard reveal" href="#contact" data-destination="tokyo" data-itinerary="food-crawl">
  <div class="gtop t1"><span class="badge">🍜 Food</span><div class="days"><span class="nn">5</span><span class="dd">days</span></div></div>
  <div class="gbody"><h3>Tokyo Food Crawl</h3><p>Ramen, sushi, and street food...</p><span class="link">Download →</span></div>
</a>
```

2. **Create & upload PDF**:
```bash
# Create Tokyo itinerary PDF as described in ITINERARY_CREATION.md

ITINERARY_BUCKET="love-and-layovers-itineraries-XXXXXXXXXXXX"

# Create folder for Tokyo
aws s3api put-object --bucket $ITINERARY_BUCKET --key tokyo/ --body /dev/null

# Upload PDF
aws s3 cp tokyo-food-crawl.pdf s3://$ITINERARY_BUCKET/tokyo/
```

3. **Update website and push**:
```bash
aws s3 cp index.html s3://$WEBSITE_BUCKET/
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

---

## 📧 Email Management

### View Subscriber List
```bash
# Export as JSON
aws dynamodb scan --table-name love-and-layovers-subscribers \
  --output json > subscribers.json

# Parse with jq
aws dynamodb scan --table-name love-and-layovers-subscribers \
  --query 'Items[*].email.S' --output text
```

### Send Bulk Email
```bash
# Using AWS SES CLI
aws ses send-email \
  --from hello@loveandlayovers.com \
  --to subscriber@example.com \
  --subject "New Singapore Guide Released!" \
  --text "Check out our latest itinerary..." \
  --region us-east-1
```

### Delete Unsubscriber
```bash
aws dynamodb delete-item \
  --table-name love-and-layovers-subscribers \
  --key '{"email":{"S":"unsubscriber@example.com"}}'
```

---

## 🔍 Monitor Website Health

### Check Lambda Performance
```bash
# CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=love-and-layovers-api \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average,Maximum
```

### Check API Errors
```bash
# View errors from logs
sam logs -n APIFunction --stack-name love-and-layovers-stack -t | grep ERROR
```

### Monitor S3 Usage
```bash
# Check bucket size
aws s3 ls s3://$WEBSITE_BUCKET --recursive --summarize

aws s3 ls s3://$ITINERARY_BUCKET --recursive --summarize
```

### Check CloudFront Performance
```bash
# List distributions
aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName]'
```

---

## 💾 Backup & Export Data

### Export Subscribers (for Newsletter)
```bash
# JSON format
aws dynamodb scan --table-name love-and-layovers-subscribers \
  --output json > subscribers_backup.json

# CSV format (requires jq)
aws dynamodb scan --table-name love-and-layovers-subscribers \
  --query 'Items[*].[email.S,subscribed_at.S]' \
  --output text | column -t > subscribers.csv
```

### Export Contact Submissions
```bash
aws dynamodb scan --table-name love-and-layovers-contacts \
  --output json > contacts_backup.json
```

### Backup Website Files
```bash
# Download everything from S3
aws s3 sync s3://$WEBSITE_BUCKET ./backup/website
aws s3 sync s3://$ITINERARY_BUCKET ./backup/itineraries
```

---

## 🚀 Deploy Updates

### Update Lambda Function
```bash
# Edit lambda_handler.py

# Rebuild & deploy
sam build
sam deploy

# Or just update function code
zip lambda_function.zip lambda_handler.py
aws lambda update-function-code \
  --function-name love-and-layovers-api \
  --zip-file fileb://lambda_function.zip
```

### Update Template
```bash
# Edit template.yaml for infrastructure changes

sam build
sam deploy
```

### Rollback
```bash
# AWS CloudFormation keeps version history
# Manually revert:
git checkout previous_version template.yaml
sam deploy
```

---

## 💰 Monitor Costs

### View AWS Costs
```bash
# SES costs (emails sent)
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --metrics BlendedCost \
  --granularity MONTHLY \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Simple Email Service"]}}'

# Lambda costs (compute)
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --metrics BlendedCost \
  --granularity MONTHLY \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["AWS Lambda"]}}'

# DynamoDB costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --metrics BlendedCost \
  --granularity MONTHLY \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon DynamoDB"]}}'
```

---

## 🔐 Security Checks

### Verify SES Configuration
```bash
# List verified emails/domains
aws ses list-verified-email-addresses

# Check sending quota
aws ses get-account-sending-enabled
```

### Check S3 Bucket Permissions
```bash
# Verify public access is blocked
aws s3api get-public-access-block --bucket $WEBSITE_BUCKET

# View bucket policy
aws s3api get-bucket-policy --bucket $WEBSITE_BUCKET
```

### Review IAM Role
```bash
# Show role attached to Lambda
aws iam list-role-policies --role-name SAM-love-and-layovers-stack-APIFunctionRole

# View inline policies
aws iam get-role-policy --role-name SAM-love-and-layovers-stack-APIFunctionRole \
  --policy-name policy-name
```

---

## 🐛 Troubleshooting Quick Fixes

### API Returns 500 Error
```bash
# Check logs
sam logs -n APIFunction --stack-name love-and-layovers-stack -t --filter "ERROR"

# Redeploy function
sam build && sam deploy
```

### Email Not Sending
```bash
# Verify sender email is confirmed
aws ses verify-email-identity --email-address hello@loveandlayovers.com

# Check if in sandbox mode
aws ses get-account-sending-enabled

# View SES logs
aws logs tail /aws/lambda/love-and-layovers-api --follow
```

### Website Showing Old Content
```bash
# Clear CloudFront cache
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

# Or specific file
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/index.html"
```

### Downloads Not Working
```bash
# Check S3 bucket exists
aws s3 ls s3://$ITINERARY_BUCKET/singapore/

# Verify PDF permissions (should be readable)
aws s3 ls s3://$ITINERARY_BUCKET/singapore/ --recursive

# Check Lambda can access S3 (check IAM role)
aws iam list-role-policies --role-name SAM-love-and-layovers-stack-APIFunctionRole
```

---

## 📝 Common Tasks Cheatsheet

| Task | Command |
|------|---------|
| View logs | `sam logs -n APIFunction -t` |
| Count subscribers | `aws dynamodb scan --table-name love-and-layovers-subscribers --select COUNT` |
| Update website | `aws s3 cp index.html s3://$WEBSITE_BUCKET/` |
| Invalidate cache | `aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"` |
| Deploy updates | `sam build && sam deploy` |
| Backup data | `aws dynamodb scan --table-name {table} --output json > backup.json` |
| Check costs | `aws ce get-cost-and-usage ...` |
| Test API | `curl -X POST {API_URL}/subscribe -d '{"email":"test@test.com"}'` |

---

## Environment Variables

Save these for quick access:

```bash
# Save to ~/.bashrc or ~/.zshrc
export WEBSITE_BUCKET="love-and-layovers-website-XXXXXXXXXXXX"
export ITINERARY_BUCKET="love-and-layovers-itineraries-XXXXXXXXXXXX"
export DIST_ID="E1ABCDEFG123"
export API_URL="https://XXXXXXXXXXXX.execute-api.us-east-1.amazonaws.com/Prod"
export AWS_REGION="us-east-1"
export STACK_NAME="love-and-layovers-stack"
```

Then use:
```bash
source ~/.bashrc
aws s3 cp index.html s3://$WEBSITE_BUCKET/
```

---

## Need Help?

- AWS Docs: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- AWS CLI Docs: [aws.amazon.com/cli](https://aws.amazon.com/cli)
- CloudFormation: [docs.aws.amazon.com/cloudformation](https://docs.aws.amazon.com/cloudformation)
- SES: [docs.aws.amazon.com/ses](https://docs.aws.amazon.com/ses)

---

**Keep this handy for quick reference!** ✈️
