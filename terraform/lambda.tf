# Zip Lambda Function Code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda_handler.py"
  output_path = "${path.module}/.terraform/lambda_function.zip"
}

# Lambda Function
resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = local.function_name
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_handler.lambda_handler"
  runtime          = "python3.11"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      SUBSCRIBERS_TABLE = aws_dynamodb_table.subscribers.name
      CONTACTS_TABLE    = aws_dynamodb_table.contacts.name
      DOWNLOADS_TABLE   = aws_dynamodb_table.downloads.name
      ITINERARIES_BUCKET = aws_s3_bucket.itineraries.id
      SES_VERIFIED_EMAIL = var.ses_verified_email
      AWS_REGION         = var.aws_region
    }
  }

  depends_on = [
    aws_iam_role_policy.dynamodb_access,
    aws_iam_role_policy.s3_access,
    aws_iam_role_policy.ses_access,
    aws_iam_role_policy.cloudwatch_logs
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "API Lambda Function"
    }
  )
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
