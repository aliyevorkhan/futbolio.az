from django.conf import settings
from django.core.management.base import BaseCommand

from common.storage import _client


class Command(BaseCommand):
    """Idempotent — safe to run on every backend boot (see docker-compose
    command: this runs before each deploy/restart so the bucket's CORS
    policy never drifts from CORS_ALLOWED_ORIGINS).
    """

    help = "Idempotently configure the S3 bucket's CORS policy for direct browser uploads."

    def handle(self, *args, **options):
        client = _client()
        client.put_bucket_cors(
            Bucket=settings.AWS_S3_BUCKET,
            CORSConfiguration={
                "CORSRules": [
                    {
                        "AllowedOrigins": settings.CORS_ALLOWED_ORIGINS,
                        "AllowedMethods": ["GET", "PUT", "POST"],
                        "AllowedHeaders": ["Content-Type", "x-amz-*"],
                        # The frontend's multipart upload reads the ETag
                        # response header on every PUT — without exposing
                        # it cross-origin, multipart completion silently
                        # breaks even once the base CORS issue is fixed.
                        "ExposeHeaders": ["ETag"],
                        "MaxAgeSeconds": 3600,
                    }
                ]
            },
        )
        self.stdout.write(self.style.SUCCESS(f"CORS configured for bucket {settings.AWS_S3_BUCKET}"))
