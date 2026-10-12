from django.conf import settings as django_settings
from django.db import models

# Scalar site-wide settings (phone number, social links, retention knobs an
# admin can tune) — spec section 4 requires these live in one place so
# changing a number/link updates the whole site at once, never hardcoded
# in multiple components.
DEFAULT_SETTINGS = {
    "whatsapp_number": "994993990069",
    "whatsapp_default_text": "Salam, oyunçu lazımdır",
    "phone_number": "+994993990069",
    "instagram_url": "https://instagram.com/futbolio.az",
    "instagram_dm_url": "https://ig.me/m/futbolio.az",
    "tiktok_url": "",
}


class SettingEntry(models.Model):
    key = models.CharField(max_length=100, primary_key=True)
    value = models.JSONField()
    updated_by = models.ForeignKey(
        django_settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key


class VideoCard(models.Model):
    link = models.URLField()
    cover_image_key = models.CharField(max_length=255)
    caption = models.CharField(max_length=120, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "created_at"]


class FAQItem(models.Model):
    question = models.CharField(max_length=300)
    answer = models.TextField()
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "created_at"]
