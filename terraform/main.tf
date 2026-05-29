terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment to use S3 backend for state (recommended for production)
  # backend "s3" {
  #   bucket         = "love-and-layovers-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Local values for naming consistency
locals {
  project_short = "lal"
  function_name = "${var.project_name}-api"

  # Unique suffixes for S3 bucket names (S3 bucket names must be globally unique)
  s3_suffix = data.aws_caller_identity.current.account_id

  # Tags to apply to all resources
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  )
}
