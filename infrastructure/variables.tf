variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Prefix used for all resource names"
  type        = string
  default     = "management-app"
}

variable "lambda_zip_path" {
  description = "Local path to the zipped Lambda deployment package"
  type        = string
  default     = "../build/lambda.zip"
}

variable "mongo_uri" {
  description = "MongoDB Atlas connection string"
  type        = string
  sensitive   = true
}

variable "jwt_secret_key" {
  description = "Secret key used to sign JWTs"
  type        = string
  sensitive   = true
}

variable "access_token_expire_minutes" {
  description = "JWT expiry in minutes"
  type        = number
  default     = 60
}

variable "lambda_role_arn" {
  description = "ARN of existing IAM role for Lambda"
  type        = string
}