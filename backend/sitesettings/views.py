from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdmin

from .models import FAQItem, VideoCard
from .serializers import (
    FAQItemAdminSerializer,
    FAQItemPublicSerializer,
    ScalarSettingsSerializer,
    VideoCardAdminSerializer,
    VideoCardPublicSerializer,
)
from .services import get_all_scalar_settings, set_setting


class PublicSettingsView(APIView):
    """GET /api/public/settings/ — the single source the whole marketing
    site reads phone/social links/video cards/FAQ from (spec section 4).
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                **ScalarSettingsSerializer(get_all_scalar_settings()).data,
                "video_cards": VideoCardPublicSerializer(
                    VideoCard.objects.filter(is_active=True), many=True
                ).data,
                "faq": FAQItemPublicSerializer(FAQItem.objects.filter(is_active=True), many=True).data,
            }
        )


class AdminScalarSettingsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(get_all_scalar_settings())

    def put(self, request):
        serializer = ScalarSettingsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for key, value in serializer.validated_data.items():
            set_setting(key, value, updated_by=request.user)
        return Response(get_all_scalar_settings())


class VideoCardAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = VideoCardAdminSerializer
    queryset = VideoCard.objects.all()


class FAQItemAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = FAQItemAdminSerializer
    queryset = FAQItem.objects.all()
