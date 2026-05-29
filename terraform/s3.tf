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

# Remove public access block to allow website hosting
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
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

# S3 Bucket Policy - Allow Public Read Access and CloudFront
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "PublicReadGetObject"
        Effect = "Allow"
        Principal = "*"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
      },
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

# S3 Website Hosting Configuration
resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
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
