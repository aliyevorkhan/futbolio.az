#!/bin/sh
# One-shot bucket bootstrap for local MinIO, run by the `minio-init` compose
# service. Creates the bucket used by django-storages and makes it private
# (the app only ever hands out short-lived presigned URLs — see
# backend/common/storage.py — so the bucket itself must never be public).
set -eu

mc alias set local "$AWS_S3_ENDPOINT_URL" "$AWS_ACCESS_KEY_ID" "$AWS_SECRET_ACCESS_KEY"
mc mb --ignore-existing "local/$AWS_S3_BUCKET"
mc anonymous set none "local/$AWS_S3_BUCKET"

echo "MinIO bucket '$AWS_S3_BUCKET' ready (private)."
