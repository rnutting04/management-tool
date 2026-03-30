#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# deploy.sh — build & deploy backend (Lambda) and frontend (S3/CloudFront)
#
# Prerequisites:
#   - AWS CLI configured (aws configure or env vars)
#   - Terraform installed
#   - Python 3.11 + pip available
#   - Node/npm available (for frontend build)
#
# Usage:
#   ./scripts/deploy.sh [backend|frontend|all]   (default: all)
# ---------------------------------------------------------------------------

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT/build"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
INFRA_DIR="$ROOT/infrastructure"
ZIP_PATH="$BUILD_DIR/lambda.zip"

DEPLOY_TARGET="${1:-all}"

mkdir -p "$BUILD_DIR"

# ---------------------------------------------------------------------------
# Helper: get Terraform output value
# ---------------------------------------------------------------------------
tf_output() {
  terraform -chdir="$INFRA_DIR" output -raw "$1"
}

# ---------------------------------------------------------------------------
# BACKEND — zip backend + dependencies, upload to Lambda
# ---------------------------------------------------------------------------
deploy_backend() {
  echo "==> Building Lambda package..."

  PKG_DIR="$BUILD_DIR/lambda_pkg"
  rm -rf "$PKG_DIR"
  mkdir -p "$PKG_DIR"

  # Install dependencies into package dir
  pip install \
    --quiet \
    --target "$PKG_DIR" \
    --platform manylinux2014_x86_64 \
    --python-version 3.11 \
    --only-binary=:all: \
    -r "$BACKEND_DIR/requirements.txt"

  # Copy app source on top
  cp "$BACKEND_DIR"/*.py "$PKG_DIR/"
  cp -r "$BACKEND_DIR/routes" "$PKG_DIR/"

  # Zip
  rm -f "$ZIP_PATH"
  (cd "$PKG_DIR" && zip -r "$ZIP_PATH" . -x "*.pyc" -x "*/__pycache__/*" > /dev/null)
  echo "    Lambda zip: $ZIP_PATH ($(du -sh "$ZIP_PATH" | cut -f1))"

  # Get the function name from Terraform output
  FUNCTION_NAME="$(tf_output api_gateway_url | grep -oP '(?<=execute-api\.[^/]+\.amazonaws\.com/).*' || true)"
  # Fallback: derive from variables default
  FUNCTION_NAME="$(tf_output lambda_function_name)"

  echo "==> Updating Lambda function code..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_PATH" \
    --output text \
    --query 'FunctionArn'

  echo "    Done."
}

# ---------------------------------------------------------------------------
# FRONTEND — build React app, sync to S3, invalidate CloudFront
# ---------------------------------------------------------------------------
deploy_frontend() {
  echo "==> Building React app..."
  (cd "$FRONTEND_DIR" && npm ci --silent && npm run build)

  S3_BUCKET="$(tf_output s3_bucket_name)"
  CF_ID="$(terraform -chdir="$INFRA_DIR" output -raw cloudfront_distribution_id 2>/dev/null || true)"

  echo "==> Syncing to s3://$S3_BUCKET ..."
  aws s3 sync "$FRONTEND_DIR/build" "s3://$S3_BUCKET" \
    --delete \
    --cache-control "public,max-age=31536000,immutable" \
    --exclude "index.html"

  # index.html should not be cached by browsers
  aws s3 cp "$FRONTEND_DIR/build/index.html" "s3://$S3_BUCKET/index.html" \
    --cache-control "no-cache,no-store,must-revalidate"

  if [[ -n "$CF_ID" ]]; then
    echo "==> Invalidating CloudFront distribution $CF_ID ..."
    aws cloudfront create-invalidation \
      --distribution-id "$CF_ID" \
      --paths "/*" \
      --output text \
      --query 'Invalidation.Id'
  else
    echo "    (skipping CloudFront invalidation — run 'terraform output' to check cloudfront_distribution_id)"
  fi

  echo "    Done. Site: $(tf_output cloudfront_url)"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
case "$DEPLOY_TARGET" in
  backend)  deploy_backend ;;
  frontend) deploy_frontend ;;
  all)
    deploy_backend
    deploy_frontend
    ;;
  *)
    echo "Usage: $0 [backend|frontend|all]"
    exit 1
    ;;
esac
