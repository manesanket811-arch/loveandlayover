# S3 Bucket for Website Files
resource "aws_s3_bucket" "website" {
  bucket = "${var.project_name}-website-${local.s3_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "Website Bucket"
    }
  )
}

# Enable versioning on website bucket
resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id

  versioning_configuration {
    status = var.s3_versioning_enabled ? "Enabled" : "Suspended"
  }
}

# Block all public access to website bucket
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Itineraries (PDFs)
resource "aws_s3_bucket" "itineraries" {
  bucket = "${var.project_name}-itineraries-${local.s3_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "Itineraries Bucket"
    }
  )
}

# Enable versioning on itineraries bucket
resource "aws_s3_bucket_versioning" "itineraries" {
  bucket = aws_s3_bucket.itineraries.id

  versioning_configuration {
    status = var.s3_versioning_enabled ? "Enabled" : "Suspended"
  }
}

# Block all public access to itineraries bucket
resource "aws_s3_bucket_public_access_block" "itineraries" {
  bucket = aws_s3_bucket.itineraries.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Identity for accessing S3
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.project_name}"
}

# S3 Bucket Policy for CloudFront Access
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })
}

# Upload index.html to S3 (optional - you can upload manually after)
resource "aws_s3_object" "index_html" {
  bucket       = aws_s3_bucket.website.id
  key          = "index.html"
  source       = "${path.module}/../index.html"
  content_type = "text/html"
  etag         = filemd5("${path.module}/../index.html")

  tags = local.common_tags
}

# S3 bucket for storing Terraform state (optional, for production)
# Uncomment if you want to use S3 backend
# resource "aws_s3_bucket" "terraform_state" {
#   bucket = "${var.project_name}-terraform-state-${local.s3_suffix}"
#
#   tags = merge(
#     local.common_tags,
#     {
#       Name = "Terraform State Bucket"
#     }
#   )
# }
#
# resource "aws_s3_bucket_versioning" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id
#
#   versioning_configuration {
#     status = "Enabled"
#   }
# }
#
# resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id
#
#   rule {
#     apply_server_side_encryption_by_default {
#       sse_algorithm = "AES256"
#     }
#   }
# }
