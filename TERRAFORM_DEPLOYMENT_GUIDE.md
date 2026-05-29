# Terraform Deployment Guide for Love and Layovers

This guide explains how to deploy the Love and Layovers website infrastructure to AWS using Terraform.

## Prerequisites

Before you begin, ensure you have:

1. **AWS Account** with appropriate permissions to create resources
2. **AWS Credentials** configured locally:
   - Install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
   - Configure credentials: `aws configure` (uses `~/.aws/credentials`)
3. **Terraform** installed:
   - Download from https://www.terraform.io/downloads
   - Version 1.0 or higher recommended
4. **Git** with the repository cloned:
   - Repository: https://github.com/manesanket811-arch/loveandlayover
5. **SES Verified Email** (optional for email functionality):
   - If using email features, verify a domain or email in AWS SES
   - Alternative: Use Mailgun, SendGrid, or Gmail SMTP (see INFRASTRUCTURE_GUIDE.md)

## Project Structure

```
loveandlayover/
├── terraform/
│   ├── main.tf                 # Provider configuration
│   ├── variables.tf            # Input variables definition
│   ├── terraform.tfvars        # Default/example variable values
│   ├── s3.tf                   # S3 bucket configuration
│   ├── dynamodb.tf             # DynamoDB tables
│   ├── iam.tf                  # IAM roles and policies
│   ├── lambda.tf               # Lambda function
│   ├── api_gateway.tf          # API Gateway endpoints
│   ├── cloudfront.tf           # CloudFront distribution
│   ├── outputs.tf              # Terraform outputs
│   └── .terraform/             # Terraform working directory (auto-created)
├── index.html                  # Website frontend
├── lambda_handler.py           # Lambda function code
├── requirements.txt            # Python dependencies
└── itineraries/               # PDF itineraries folder
```

## Step 1: Initialize Terraform

Before deploying, initialize Terraform to download provider plugins and set up the working directory:

```powershell
cd terraform
terraform init
```

This command:
- Downloads AWS provider plugin
- Initializes Terraform backend (local state by default)
- Creates `.terraform/` directory

**Note:** For production deployments, consider using a remote backend (S3 + DynamoDB) instead of local state:

```hcl
# Add to main.tf for remote state
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "loveandlayover/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}
```

## Step 2: Customize Configuration

Edit `terraform.tfvars` to match your environment:

```hcl
project_name = "loveandlayover"
environment  = "production"
aws_region   = "us-east-1"

# Update with your domain and email
website_domain     = "your-domain.com"
ses_verified_email = "your-verified-email@your-domain.com"

# Customize tags
tags = {
  Project     = "Love and Layovers"
  Environment = "production"
  ManagedBy   = "Terraform"
  CreatedDate = "2026-05-29"
}
```

### Key Variables to Customize

- **project_name**: Used for resource naming (e.g., bucket names, function names)
- **aws_region**: AWS region for deployment (default: `us-east-1` for CloudFront)
- **website_domain**: Your domain name (for reference, not auto-configured by Terraform)
- **ses_verified_email**: Email verified in AWS SES (leave default if not using email)
- **enable_cloudfront**: Set to `true` to enable CDN (recommended)
- **lambda_timeout**: Lambda function timeout in seconds (default: 30)
- **lambda_memory_size**: Lambda memory allocation (default: 256 MB)

## Step 3: Validate Configuration

Before applying, validate the Terraform configuration:

```powershell
terraform validate
```

This checks for syntax errors in `.tf` files.

## Step 4: Plan Deployment

Preview the resources Terraform will create:

```powershell
terraform plan
```

This outputs a detailed plan showing:
- Resources to be created
- Resource properties and values
- No changes are made to AWS

**Save the plan to a file** (optional but recommended):

```powershell
terraform plan -out=tfplan
```

Then review the plan before applying.

## Step 5: Apply Configuration

Deploy infrastructure to AWS:

```powershell
terraform apply
```

Or apply a saved plan:

```powershell
terraform apply tfplan
```

Terraform will:
1. Create S3 buckets (website, itineraries)
2. Create DynamoDB tables (subscribers, contacts, downloads)
3. Create IAM roles and policies
4. Create Lambda function from `lambda_handler.py`
5. Create API Gateway with three endpoints (/subscribe, /contact, /download-itinerary)
6. Create CloudFront distribution (if enabled)
7. Output resource details and endpoints

**Important:** The initial apply may take 2-5 minutes.

## Step 6: Retrieve Outputs

After deployment, Terraform outputs important information:

```powershell
terraform output
```

Key outputs include:
- **api_gateway_endpoint**: API base URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/production`)
- **cloudfront_domain_name**: CloudFront URL (e.g., `d123.cloudfront.net`)
- **website_bucket_name**: S3 bucket name for website
- **lambda_function_name**: Lambda function name
- **dynamodb_table_names**: DynamoDB table names

**Copy the API endpoint** and update in `index.html`:

```javascript
// In index.html, update the API_BASE_URL
const API_BASE_URL = "https://your-api-endpoint-here.execute-api.us-east-1.amazonaws.com/production";
```

## Step 7: Upload Website Files

Upload `index.html` and other static assets to S3:

```powershell
# Get bucket name from outputs
$BUCKET = terraform output -raw website_bucket_name

# Upload index.html
aws s3 cp ../index.html s3://$BUCKET/index.html

# Upload itineraries (PDFs)
aws s3 cp ../itineraries/ s3://$(terraform output -raw itineraries_bucket_name)/ --recursive
```

## Step 8: Access Your Website

### Current Setup (S3 Direct - CloudFront Disabled)
```
https://<bucket-name>.s3.us-east-1.amazonaws.com/index.html
```

**Note**: CloudFront is currently disabled in `terraform.tfvars` (`enable_cloudfront = false`) since no real traffic is expected. The CDN code is ready—you can enable it anytime by changing `enable_cloudfront = true` and running `terraform apply`.

### Enable CloudFront Later
To switch to CloudFront delivery (for production):
1. Edit `terraform.tfvars`: `enable_cloudfront = true`
2. Run `terraform apply`
3. Access via: `https://d123abc.cloudfront.net`

### With Custom Domain
After setting up Route 53 or updating DNS:
```
https://loveandlayover.com
```

## Common Operations

### View Current State
```powershell
terraform show
```

### Destroy All Resources (CAUTION)
```powershell
terraform destroy
```

This removes ALL AWS resources. Use only if you no longer need the deployment.

### Update Infrastructure
1. Modify `.tf` files or `terraform.tfvars`
2. Run `terraform plan` to preview changes
3. Run `terraform apply` to apply changes

### View Resource Details
```powershell
# Get specific output
terraform output api_gateway_endpoint

# Get all outputs as JSON
terraform output -json
```

### Manage State
```powershell
# List all managed resources
terraform state list

# Show specific resource details
terraform state show aws_lambda_function.api

# Remove resource from state (expert use only)
terraform state rm aws_s3_bucket.website
```

## Cost Considerations

**Current Estimated Monthly Costs** (CloudFront disabled):
- **S3**: $0.10-0.50 (minimal traffic)
- **DynamoDB**: $1-2 (on-demand billing)
- **Lambda**: $0.05-0.20 (few requests)
- **Total**: ~$1-3/month (development scale)

**With CloudFront Enabled** (for production):
- Add **CloudFront**: $0.085 per GB + $0.01 per 10,000 requests
- **Total with CDN**: ~$5-15/month

**Cost Optimization Tips:**
1. Currently using S3 direct (no CDN cost) — perfect for testing
2. Enable CloudFront when ready for production: `enable_cloudfront = true`
3. Change `dynamodb_billing_mode` to "PROVISIONED" for predictable costs
4. Set `cloudfront_price_class = "PriceClass_200"` for lower CloudFront costs
5. Monitor CloudWatch logs for unexpected Lambda invocations

## Troubleshooting

### Error: "No AWS credentials found"
```powershell
aws configure
# Enter: AWS Access Key ID, Secret Access Key, Region, Output format
```

### Error: "Bucket already exists"
S3 bucket names are globally unique. If a bucket exists:
1. Change `project_name` in `terraform.tfvars`
2. Or use a different AWS account

### Lambda function not working
1. Check Lambda environment variables in `terraform/lambda.tf`
2. Verify DynamoDB table names match
3. Check CloudWatch logs: `aws logs tail /aws/lambda/loveandlayover-api --follow`

### API Gateway returning 403 Forbidden
Ensure Lambda has correct permissions in `terraform/iam.tf`:
```powershell
# Check role policies
aws iam list-role-policies --role-name loveandlayover-lambda-role
```

### CloudFront caching issues
Clear CloudFront cache:
```powershell
$DISTRIBUTION_ID = terraform output -raw cloudfront_distribution_id
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

## Security Best Practices

1. **State File Security**: Don't commit `terraform.tfstate` to Git
   - Add to `.gitignore`: `terraform/terraform.tfstate*`
   - Use remote backend for shared team access

2. **AWS Credentials**: Use IAM users, not root account
   - Create IAM user with only necessary permissions
   - Rotate access keys regularly

3. **S3 Bucket Security**:
   - Public access is blocked by default
   - Website bucket is accessed via CloudFront with OAI
   - Itineraries bucket accessible only to Lambda

4. **DynamoDB Encryption**: Add encryption at rest
   - Enable in `terraform/dynamodb.tf`: `server_side_encryption_specification`

5. **API Gateway Throttling**: Add request throttling to prevent abuse
   - Add to `terraform/api_gateway.tf`: `usage_plan` and `api_key`

## Monitoring and Logging

### View Lambda Logs
```powershell
# Real-time logs
aws logs tail /aws/lambda/loveandlayover-api --follow

# Filter by error
aws logs filter-log-events --log-group-name /aws/lambda/loveandlayover-api --filter-pattern "ERROR"
```

### View API Gateway Logs
```powershell
aws logs tail /aws/api-gateway/loveandlayover-api --follow
```

### Check DynamoDB Usage
```powershell
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedWriteCapacityUnits \
  --dimensions Name=TableName,Value=loveandlayover-subscribers \
  --start-time 2026-05-29T00:00:00Z \
  --end-time 2026-05-30T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Next Steps

1. **Set Up DNS**: Point your domain to CloudFront distribution
2. **Configure SES**: Verify domain/email for email functionality
3. **Upload Itineraries**: Add PDF files to itineraries S3 bucket
4. **Update index.html**: Change API endpoint and customize content
5. **Test Features**: Test subscribe, contact, and download flows
6. **Set Up Monitoring**: Configure CloudWatch alarms for key metrics
7. **Enable Analytics**: Integrate Google Analytics in `index.html`

## Support

For issues:
1. Check CloudWatch logs for errors
2. Review Terraform state: `terraform show`
3. Check AWS Console for resource details
4. Consult INFRASTRUCTURE_GUIDE.md for architecture details

## Additional Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Guide](https://docs.aws.amazon.com/apigateway/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
