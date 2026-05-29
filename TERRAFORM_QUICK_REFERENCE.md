# Terraform Quick Reference

Quick command reference for common Terraform operations.

## Installation

```powershell
# Install Terraform (Windows)
# Option 1: Using Chocolatey
choco install terraform

# Option 2: Download from https://www.terraform.io/downloads
# Add to PATH and verify
terraform version
```

## Project Setup

```powershell
# Navigate to terraform directory
cd terraform

# Initialize (run once per project)
terraform init

# Initialize with specific AWS profile
terraform init -var="aws_profile=your-profile"

# Initialize with remote backend
terraform init -backend-config="bucket=your-state-bucket"
```

## Configuration

```powershell
# Validate syntax
terraform validate

# Format files to standard style
terraform fmt -recursive

# Check for deprecated or unused resources
terraform plan -json | jq '.resource_changes[] | select(.type | contains("deprecated"))'
```

## Planning & Applying

```powershell
# Preview changes
terraform plan

# Save plan to file
terraform plan -out=tfplan

# Apply changes
terraform apply

# Apply without confirmation
terraform apply -auto-approve

# Apply specific plan file
terraform apply tfplan

# Apply specific target (careful!)
terraform apply -target=aws_s3_bucket.website

# Refresh state from AWS
terraform refresh
```

## Variables & Configuration

```powershell
# Use different variables file
terraform apply -var-file="prod.tfvars"

# Override specific variable
terraform apply -var="project_name=my-project"

# Set variable from environment
$env:TF_VAR_environment="staging"
terraform apply

# View variable values (in state)
terraform show | grep "variable"
```

## State Management

```powershell
# View current state
terraform show

# Show specific resource state
terraform show aws_lambda_function.api

# List all resources in state
terraform state list

# Show resource details
terraform state show aws_dynamodb_table.subscribers

# Rename resource (update references in .tf files too)
terraform state mv aws_s3_bucket.old aws_s3_bucket.new

# Remove resource from state (keeps AWS resource)
terraform state rm aws_cloudwatch_log_group.api_gateway_logs

# Replace resource (destroy and recreate)
terraform apply -replace=aws_lambda_function.api
```

## Viewing Outputs

```powershell
# Show all outputs
terraform output

# Show specific output
terraform output api_gateway_endpoint

# Get output as JSON
terraform output -json

# Get raw value (no quotes for strings)
terraform output -raw cloudfront_domain_name

# Save outputs to file
terraform output -json > outputs.json
```

## Debugging

```powershell
# Enable debug logging
$env:TF_LOG="DEBUG"
terraform plan > debug.log 2>&1

# Trace level logging (very verbose)
$env:TF_LOG="TRACE"

# Disable logging
$env:TF_LOG=""

# Get Terraform version and plugins
terraform version

# Validate backend configuration
terraform init -backend=false

# Backend diagnosis
terraform init -reconfigure
```

## Workspace Management

```powershell
# List workspaces
terraform workspace list

# Create new workspace (for environments)
terraform workspace new staging

# Switch workspace
terraform workspace select staging

# Delete workspace
terraform workspace delete staging

# Current workspace
terraform workspace show
```

## Destruction

```powershell
# Preview what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy

# Destroy without confirmation
terraform destroy -auto-approve

# Destroy specific resource
terraform destroy -target=aws_s3_bucket.website

# Destroy specific workspace
terraform workspace select staging
terraform destroy
```

## Module Operations

```powershell
# Get modules (download from registry)
terraform get

# Update modules to latest version
terraform get -update

# View module outputs
terraform output -module=vpc
```

## Import Existing Resources

```powershell
# Import existing AWS resource into state
terraform import aws_s3_bucket.website my-existing-bucket

# Import with address
terraform import -state=prod.tfstate aws_dynamodb_table.contacts table-name

# List existing AWS resources to import
aws s3 ls
```

## Lock & Unlock

```powershell
# Force unlock state (use carefully!)
terraform force-unlock LOCK_ID

# Get lock ID from error message when state is locked
```

## JSON Output & Programmatic Access

```powershell
# Get entire state as JSON
terraform show -json | ConvertFrom-Json

# Get specific output as JSON
terraform output -json api_gateway_endpoint

# Query with jq (requires jq installed)
terraform show -json | jq '.values.outputs'

# Check resource count
terraform state list | Measure-Object
```

## Performance

```powershell
# Limit parallelism (slower, safer)
terraform apply -parallelism=1

# Increase parallelism (faster)
terraform apply -parallelism=10

# Profile execution
Measure-Command { terraform apply -auto-approve }
```

## Cleanup

```powershell
# Remove .terraform directory (careful: loses cached modules)
Remove-Item .terraform -Recurse

# Reinitialize
terraform init

# Clean up old plugin cache
terraform init -upgrade
```

## Common Workflows

### Full Deployment from Scratch
```powershell
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
terraform output -json > ../outputs.json
```

### Update and Deploy
```powershell
# Edit configuration files
# Then:
terraform plan
terraform apply -auto-approve
```

### Destroy and Redeploy
```powershell
terraform destroy -auto-approve
terraform apply -auto-approve
```

### Backup State Before Major Change
```powershell
Copy-Item terraform.tfstate terraform.tfstate.backup
terraform plan
terraform apply
```

### Track Changes Over Time
```powershell
terraform plan -json > plans/$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').json
```

## Troubleshooting Commands

```powershell
# Check AWS credentials
aws sts get-caller-identity

# List resources Terraform knows about
terraform state list

# Diagnose backend issues
terraform init -backend=false

# Check syntax (before apply)
terraform validate

# See detailed error messages
terraform plan 2>&1 | Tee error.log

# Force state refresh
terraform refresh

# Show what Terraform will do (verbose)
terraform plan -no-color > plan.txt
```

## Working with Multiple Environments

```powershell
# Development
terraform workspace new dev
terraform apply -var-file="dev.tfvars"

# Staging
terraform workspace new staging
terraform apply -var-file="staging.tfvars"

# Production
terraform workspace new prod
terraform apply -var-file="prod.tfvars"

# Switch between
terraform workspace select dev
terraform workspace select staging
terraform workspace select prod
```

## AWS Specific Commands

```powershell
# Get current AWS account ID
aws sts get-caller-identity --query Account --output text

# List all S3 buckets Terraform created
aws s3 ls | grep loveandlayover

# Check Lambda logs
aws logs tail /aws/lambda/loveandlayover-api --follow

# Get API Gateway details
aws apigateway get-rest-apis --query 'items[?name==`loveandlayover-api`]'

# Describe DynamoDB table
aws dynamodb describe-table --table-name loveandlayover-subscribers
```

## Tips & Best Practices

1. **Always plan before apply**: `terraform plan` before `terraform apply`
2. **Save state files**: Keep `terraform.tfstate` in version control (or use remote backend)
3. **Use variables**: Don't hardcode values; use `terraform.tfvars`
4. **Document changes**: Use `-out` flag to save plans for review
5. **Test in dev first**: Use `terraform workspace` for staging before production
6. **Review diffs**: Always review plan output carefully
7. **Lock state**: Use remote backend with state locking for team environments
8. **Regular backups**: Backup `terraform.tfstate` before major changes
9. **Version control**: Commit `.tf` files but NOT `.tfstate` files
10. **Use modules**: Organize code with modules for reusability

## Getting Help

```powershell
# List all available commands
terraform -help

# Help for specific command
terraform plan -help
terraform apply -help

# Online documentation
# https://www.terraform.io/docs
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs
```
