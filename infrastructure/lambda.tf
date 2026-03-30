resource "aws_lambda_function" "api" {
  function_name    = "${var.app_name}-api"
  role             = var.lambda_role_arn
  filename         = var.lambda_zip_path
  runtime          = "python3.11"
  handler          = "main.handler"
  timeout          = 30
  memory_size      = 256
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      MONGO_URI                   = var.mongo_uri
      JWT_SECRET_KEY              = var.jwt_secret_key
      ACCESS_TOKEN_EXPIRE_MINUTES = tostring(var.access_token_expire_minutes)
    }
  }
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

output "lambda_function_name" {
  value = aws_lambda_function.api.function_name
}