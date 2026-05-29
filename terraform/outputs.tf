# Output the S3 website bucket name
output "website_bucket_name" {
  description = "Name of the S3 bucket for the website"
  value       = aws_s3_bucket.website.id
}

# Output the S3 itineraries bucket name
output "itineraries_bucket_name" {
  description = "Name of the S3 bucket for itineraries"
  value       = aws_s3_bucket.itineraries.id
}

# Output the DynamoDB tables
output "subscribers_table_name" {
  description = "Name of the DynamoDB subscribers table"
  value       = aws_dynamodb_table.subscribers.name
}

output "contacts_table_name" {
  description = "Name of the DynamoDB contacts table"
  value       = aws_dynamodb_table.contacts.name
}

output "downloads_table_name" {
  description = "Name of the DynamoDB downloads table"
  value       = aws_dynamodb_table.downloads.name
}

# Output the Lambda function details
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.api.arn
}

# Output the API Gateway endpoint
output "api_gateway_endpoint" {
  description = "Base URL for the API Gateway"
  value       = aws_api_gateway_stage.api.invoke_url
}

output "api_gateway_rest_api_id" {
  description = "REST API ID"
  value       = aws_api_gateway_rest_api.api.id
}

# Output the CloudFront distribution details
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = try(aws_cloudfront_distribution.cdn[0].id, "CloudFront disabled")
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = try(aws_cloudfront_distribution.cdn[0].domain_name, "CloudFront disabled")
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = try(aws_cloudfront_distribution.cdn[0].arn, "CloudFront disabled")
}

# Output the website URL
output "website_url" {
  description = "URL to access the website (via CloudFront if enabled)"
  value       = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.cdn[0].domain_name}" : "https://${aws_s3_bucket.website.bucket_regional_domain_name}"
}

# CloudWatch Log Group names for reference
output "lambda_log_group_name" {
  description = "CloudWatch Log Group for Lambda"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "api_gateway_log_group_name" {
  description = "CloudWatch Log Group for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway_logs.name
}

# S3 bucket regional domain (if not using CloudFront)
output "s3_bucket_domain" {
  description = "S3 bucket domain name (use if CloudFront is disabled)"
  value       = aws_s3_bucket.website.bucket_regional_domain_name
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}
