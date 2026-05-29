# Terraform Files Summary

Complete infrastructure-as-code setup for Love and Layovers website using Terraform.

## File Structure

```
terraform/
├── main.tf                 # Terraform and AWS provider configuration
├── variables.tf            # Input variables (28 total)
├── terraform.tfvars        # Default values for variables
├── s3.tf                   # S3 buckets (website + itineraries)
├── dynamodb.tf             # DynamoDB tables (subscribers, contacts, downloads)
├── iam.tf                  # IAM roles and policies for Lambda
├── lambda.tf               # Lambda function and CloudWatch logs
├── api_gateway.tf          # API Gateway with /subscribe, /contact, /download-itinerary
├── cloudfront.tf           # CloudFront distribution for CDN
├── outputs.tf              # Output values for deployed resources
└── .gitignore              # Git ignore rules for Terraform files
```

## File Descriptions

### 1. **main.tf** (Provider Configuration)
- Configures Terraform version and AWS provider
- Gets current AWS account ID via `data.aws_caller_identity`
- Defines local values for consistent resource naming
- `local.function_name`: e.g., `loveandlayover-api`
- `local.common_tags`: Standard tags applied to all resources

### 2. **variables.tf** (Input Variables)
28 variables for flexible configuration:
- **Project**: `project_name`, `environment`, `aws_region`, `website_domain`
- **Lambda**: `lambda_timeout`, `lambda_memory_size`
- **DynamoDB**: `dynamodb_billing_mode`, `create_dynamodb_backups`
- **CloudFront**: `enable_cloudfront`, `cloudfront_price_class`, `s3_versioning_enabled`
- **CORS**: `enable_cors`, `allowed_origins`
- **Email**: `ses_verified_email`
- **Logging**: `log_retention_days`
- **Tags**: `tags` map for resource tagging

### 3. **terraform.tfvars** (Default Values)
Example values for all variables:
```hcl
project_name = "loveandlayover"
environment  = "production"
aws_region   = "us-east-1"
website_domain = "loveandlayover.com"
ses_verified_email = "noreply@loveandlayover.com"
enable_cloudfront = true
cloudfront_price_class = "PriceClass_100"
tags = { ... }
```

### 4. **s3.tf** (S3 Buckets)
Two S3 buckets:
1. **Website Bucket** (`{project_name}-website`)
   - Stores `index.html` and static assets
   - Public access blocked
   - Versioning enabled (optional)
   - CloudFront OAI for secure access
   - Optional auto-upload of `index.html`

2. **Itineraries Bucket** (`{project_name}-itineraries`)
   - Stores PDF itineraries
   - Public access blocked
   - Only accessible to Lambda function
   - Versioning enabled (optional)

**CloudFront Access**: Both buckets are accessed via CloudFront using Origin Access Identity (OAI) for security.

### 5. **dynamodb.tf** (DynamoDB Tables)
Three NoSQL tables for data storage:

1. **Subscribers Table**
   - Hash Key: `email`
   - Streams: Enabled for real-time processing
   - Point-in-Time Recovery: Enabled (optional)
   - Stores: Email subscriptions for newsletter

2. **Contacts Table**
   - Hash Key: `contact_id` (UUID)
   - GSI: `submitted_at` for time-based queries
   - Point-in-Time Recovery: Enabled
   - Stores: Contact form submissions

3. **Downloads Table**
   - Hash Key: `download_id` (UUID)
   - GSI: `email` for user tracking
   - Point-in-Time Recovery: Enabled
   - Stores: Itinerary download records

All tables use **on-demand billing** (pay-per-request, scales automatically).

### 6. **iam.tf** (IAM Roles and Policies)
Lambda execution role with four policies:

1. **Lambda Basic Execution**: CloudWatch Logs permission
2. **DynamoDB Access**: Read/write to all three tables and GSIs
3. **S3 Access**: GetObject from itineraries bucket
4. **SES Access**: SendEmail and SendRawEmail permissions
5. **CloudWatch Logs**: CreateLogGroup, CreateLogStream, PutLogEvents

Trust relationship allows Lambda service to assume role.

### 7. **lambda.tf** (Lambda Function)
Lambda function for API backend:
- **Runtime**: Python 3.11
- **Handler**: `lambda_handler.lambda_handler`
- **Source**: Zipped from `lambda_handler.py`
- **Timeout**: 30 seconds (configurable)
- **Memory**: 256 MB (configurable)
- **Environment Variables**:
  - `SUBSCRIBERS_TABLE`, `CONTACTS_TABLE`, `DOWNLOADS_TABLE`
  - `ITINERARIES_BUCKET`, `SES_VERIFIED_EMAIL`, `AWS_REGION`

Also creates:
- CloudWatch Log Group: `/aws/lambda/loveandlayover-api`
- API Gateway permission to invoke Lambda

### 8. **api_gateway.tf** (API Gateway)
REST API with three endpoints:

1. **POST /subscribe**
   - Email subscription
   - Stores in DynamoDB subscribers table

2. **POST /contact**
   - Contact form submission
   - Stores in DynamoDB contacts table
   - (Optional) Sends SES email

3. **POST /download-itinerary**
   - Download itinerary PDF
   - Tracks in DynamoDB downloads table
   - Returns presigned S3 URL

**CORS Support**: OPTIONS method on all endpoints for cross-origin requests.

**Integration**: All endpoints use AWS_PROXY (Lambda proxy integration).

**Deployment**: 
- Stage: Named after `var.environment` (e.g., "production")
- Invoke URL: `https://{api-id}.execute-api.{region}.amazonaws.com/{stage}`

**CloudWatch Logging**: Log group at `/aws/api-gateway/loveandlayover-api`

### 9. **cloudfront.tf** (CloudFront Distribution)
CDN for global delivery (currently **disabled**, enable by setting `enable_cloudfront = true` in `terraform.tfvars`):

**Origins**:
1. **S3 Origin**: Website bucket via OAI
2. **API Gateway Origin**: For `/api/*` requests

**Cache Behaviors**:
- **Default** (S3): 1 hour TTL, compression enabled
- **API**: 0 second TTL (no caching), all HTTP methods allowed

**Features**:
- IPv6 enabled
- HTTP/2 and HTTP/3 support
- Custom error responses (404/403 → index.html for SPA routing)
- Automatic cache invalidation on `index.html` changes

**Price Class**: Configurable (PriceClass_100 = budget-friendly)

### 10. **outputs.tf** (Terraform Outputs)
Important values printed after `terraform apply`:

**S3 Buckets**:
- `website_bucket_name`
- `itineraries_bucket_name`

**DynamoDB**:
- `subscribers_table_name`, `contacts_table_name`, `downloads_table_name`

**Lambda**:
- `lambda_function_name`, `lambda_function_arn`

**API Gateway**:
- `api_gateway_endpoint` (base URL for API calls)
- `api_gateway_rest_api_id`

**CloudFront**:
- `cloudfront_distribution_id`
- `cloudfront_domain_name` (website URL)
- `cloudfront_distribution_arn`

**Logs**:
- `lambda_log_group_name`
- `api_gateway_log_group_name`

**General**:
- `website_url` (CloudFront or S3)
- `region`, `project_name`, `environment`

### 11. **.gitignore** (Git Ignore Rules)
Prevents committing sensitive files:
- `terraform.tfstate*` (state files)
- `*.tfplan` (plan files)
- `.terraform/` (working directory)
- `*.pem` (SSH keys)
- `*.tfvars.json` (variable overrides)
- `__pycache__/` (Python cache)
- `.vscode/`, `.idea/` (IDE files)

## Deployment Workflow

1. **Initialize**: `terraform init` (download providers)
2. **Configure**: Edit `terraform.tfvars` with your values
3. **Validate**: `terraform validate` (check syntax)
4. **Plan**: `terraform plan` (preview changes)
5. **Apply**: `terraform apply` (create AWS resources)
6. **Upload**: Use `aws s3 cp` to upload website files
7. **Access**: Use CloudFront URL or custom domain

## Key Features

✅ **Infrastructure as Code**: All AWS resources defined in Terraform  
✅ **Serverless Architecture**: No EC2 instances to manage  
✅ **Optional CloudFront CDN**: Included but disabled for now (~$1-3/month without, enable anytime)  
✅ **Scalable Database**: DynamoDB on-demand for automatic scaling  
✅ **Secure Access**: S3 public access blocked, CloudFront OAI for future CDN use  
✅ **CORS Support**: API handles cross-origin requests  
✅ **Logging**: CloudWatch integration for monitoring  
✅ **Point-in-Time Recovery**: DynamoDB backup capability  
✅ **Cost Optimized**: Currently ~$1-3/month (S3 direct), scales to $5-15/month with CloudFront  
✅ **Environment Variables**: Lambda gets table names and bucket names from Terraform  

## Dependencies

The Terraform files reference each other in proper order:
- `s3.tf` → `cloudfront.tf` (CloudFront needs S3 bucket)
- `dynamodb.tf` → `iam.tf` (IAM policy needs DynamoDB ARNs)
- `iam.tf` → `lambda.tf` (Lambda needs IAM role)
- `lambda.tf` → `api_gateway.tf` (API Gateway needs Lambda ARN)
- `api_gateway.tf` → `cloudfront.tf` (CloudFront needs API Gateway URL)

Terraform automatically handles dependency ordering.

## To Get Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/manesanket811-arch/loveandlayover.git
   cd loveandlayover
   ```

2. **Initialize Terraform**:
   ```bash
   cd terraform
   terraform init
   ```

3. **Review the plan**:
   ```bash
   terraform plan
   ```

4. **Deploy**:
   ```bash
   terraform apply
   ```

5. **Save outputs** (needed to update `index.html`):
   ```bash
   terraform output > ../terraform_outputs.txt
   ```

See **TERRAFORM_DEPLOYMENT_GUIDE.md** for detailed step-by-step instructions.

## Questions?

Refer to:
- **INFRASTRUCTURE_GUIDE.md**: Architecture overview
- **TERRAFORM_DEPLOYMENT_GUIDE.md**: Step-by-step deployment
- **AWS_DEPLOYMENT_GUIDE.md**: AWS-specific configuration
- [Terraform Docs](https://www.terraform.io/docs)
- [AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
