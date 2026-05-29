# DynamoDB Table for Email Subscribers
resource "aws_dynamodb_table" "subscribers" {
  name           = "${var.project_name}-subscribers"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "email"
  stream_specification {
    stream_view_type = "NEW_AND_OLD_IMAGES"
  }

  attribute {
    name = "email"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.create_dynamodb_backups
  }

  tags = merge(
    local.common_tags,
    {
      Name = "Subscribers Table"
    }
  )
}

# DynamoDB Table for Contact Submissions
resource "aws_dynamodb_table" "contacts" {
  name         = "${var.project_name}-contacts"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "contact_id"

  attribute {
    name = "contact_id"
    type = "S"
  }

  attribute {
    name = "submitted_at"
    type = "S"
  }

  global_secondary_index {
    name            = "submitted_at-index"
    hash_key        = "submitted_at"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.create_dynamodb_backups
  }

  tags = merge(
    local.common_tags,
    {
      Name = "Contacts Table"
    }
  )
}

# DynamoDB Table for Download Tracking
resource "aws_dynamodb_table" "downloads" {
  name         = "${var.project_name}-downloads"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "download_id"

  attribute {
    name = "download_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.create_dynamodb_backups
  }

  tags = merge(
    local.common_tags,
    {
      Name = "Downloads Table"
    }
  )
}

# DynamoDB Table for Terraform State Lock (optional)
# Uncomment if using S3 backend with DynamoDB lock
# resource "aws_dynamodb_table" "terraform_locks" {
#   name           = "terraform-locks"
#   billing_mode   = "PAY_PER_REQUEST"
#   hash_key       = "LockID"
#
#   attribute {
#     name = "LockID"
#     type = "S"
#   }
#
#   tags = merge(
#     local.common_tags,
#     {
#       Name = "Terraform Lock Table"
#     }
#   )
# }
