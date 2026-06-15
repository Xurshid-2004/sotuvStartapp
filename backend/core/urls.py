from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, MyTokenObtainPairView, MeView,
    ProductViewSet, RequestViewSet,
    ConversationViewSet, FavoriteViewSet, UnreadCountView,
)

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("requests", RequestViewSet, basename="request")
router.register("conversations", ConversationViewSet, basename="conversation")
router.register("favorites", FavoriteViewSet, basename="favorite")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", MyTokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("unread/", UnreadCountView.as_view(), name="unread"),
    path("", include(router.urls)),
]
