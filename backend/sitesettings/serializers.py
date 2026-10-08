from rest_framework import serializers

from common.storage import presign_get

from .models import FAQItem, VideoCard

# Public marketing assets (video cover images) are not personal/sensitive
# data, but the bucket itself stays uniformly private per spec section
# 10.3 ("no object is ever public-read") — so even these are served via a
# presigned URL, just a long-lived one (24h) since there's no harm in it
# being guessable/cacheable for a day, unlike candidate files.
COVER_IMAGE_TTL_SECONDS = 24 * 60 * 60


class VideoCardPublicSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = VideoCard
        fields = ["id", "link", "cover_image_url", "caption"]

    def get_cover_image_url(self, obj):
        if not obj.cover_image_key:
            return None
        return presign_get(obj.cover_image_key, ttl=COVER_IMAGE_TTL_SECONDS)


class FAQItemPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQItem
        fields = ["id", "question", "answer"]


class VideoCardAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoCard
        fields = [
            "id",
            "link",
            "cover_image_key",
            "caption",
            "order",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class FAQItemAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQItem
        fields = ["id", "question", "answer", "order", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ScalarSettingsSerializer(serializers.Serializer):
    whatsapp_number = serializers.CharField()
    whatsapp_default_text = serializers.CharField()
    phone_number = serializers.CharField()
    instagram_url = serializers.CharField()
    instagram_dm_url = serializers.CharField()
    tiktok_url = serializers.CharField(allow_blank=True)
