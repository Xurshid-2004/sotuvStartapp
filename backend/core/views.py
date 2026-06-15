from rest_framework import generics, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q

from .models import (
    User, Product, Request, Conversation, Message, Favorite,
)
from .serializers import (
    RegisterSerializer, MyTokenObtainPairSerializer,
    ProductSerializer, RequestSerializer, UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class IsIshlabChiqaruvchi(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.ISHLAB_CHIQARUVCHI
        )


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Product.objects.select_related("manufacturer").all()
        # Ishlab chiqaruvchi faqat o'z mahsulotlarini boshqaradi.
        # Yozish amallarida o'ziniki, ko'rishda hammasi ko'rinadi (sotuvchi tanlashi uchun)
        if self.action in ["list", "retrieve"]:
            mine = self.request.query_params.get("mine")
            if mine == "1" and user.role == User.ISHLAB_CHIQARUVCHI:
                return qs.filter(manufacturer=user)
            return qs
        return qs.filter(manufacturer=user)

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsIshlabChiqaruvchi()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(manufacturer=self.request.user)


class RequestViewSet(viewsets.ModelViewSet):
    serializer_class = RequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Request.objects.select_related("seller", "product", "product__manufacturer")
        if user.role == User.SOTUVCHI:
            return qs.filter(seller=user)
        # ishlab chiqaruvchi -> o'z mahsulotlariga kelgan murojaatlar
        return qs.filter(product__manufacturer=user)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @action(detail=True, methods=["post"])
    def set_status(self, request, pk=None):
        """Ishlab chiqaruvchi buyurtma holatini o'zgartiradi.
        body: { "status": "...", "reject_reason": "..." (rad uchun) }

        Faqat shu buyurtma mahsulotining egasi (ishlab chiqaruvchi) o'zgartira oladi.
        Rad/qabul qilinganda sotuvchiga avtomatik chat xabari yuboriladi."""
        req = self.get_object()

        # Xavfsizlik: faqat mahsulot egasi (get_queryset allaqachon filtrlaydi, ammo
        # qo'shimcha aniq tekshiruv)
        if request.user.role != User.ISHLAB_CHIQARUVCHI:
            return Response(
                {"detail": "Faqat ishlab chiqaruvchi holatni o'zgartira oladi."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if req.product.manufacturer_id != request.user.id:
            return Response(
                {"detail": "Bu buyurtma sizning mahsulotingizga tegishli emas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get("status")
        valid = dict(Request.STATUS_CHOICES)
        if new_status not in valid:
            return Response({"detail": "Noto'g'ri holat."}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils import timezone
        reject_reason = (request.data.get("reject_reason") or "").strip()

        req.status = new_status
        req.responded_at = timezone.now()
        if new_status == Request.RAD:
            req.reject_reason = reject_reason or "Sabab ko'rsatilmadi"
        else:
            req.reject_reason = ""

        # "Yuborildi" bo'lsa zaxiradan ayiriladi (manfiyga tushmaydi)
        if new_status == Request.YUBORILDI:
            product = req.product
            product.stock = max(0, product.stock - req.quantity)
            product.save(update_fields=["stock"])

        req.save()

        # Sotuvchiga avtomatik chat xabari
        self._notify_seller(req, new_status)

        return Response(RequestSerializer(req, context={"request": request}).data)

    def _notify_seller(self, req, new_status):
        """Holat o'zgarganda sotuvchiga suhbat orqali xabar yuborish."""
        manufacturer = req.product.manufacturer
        seller = req.seller
        a, b = Conversation.normalize(manufacturer, seller)
        conv, _ = Conversation.objects.get_or_create(
            participant_a=a, participant_b=b,
            defaults={"product": req.product},
        )
        labels = {
            Request.QABUL: f"✅ Buyurtmangiz qabul qilindi: {req.product.name} — {req.quantity} {req.product.unit}.",
            Request.YUBORILDI: f"📦 Buyurtmangiz yuborildi: {req.product.name} — {req.quantity} {req.product.unit}.",
            Request.RAD: f"❌ Buyurtmangiz qabul qilinmadi: {req.product.name}. Sabab: {req.reject_reason}",
        }
        text = labels.get(new_status)
        if text:
            Message.objects.create(conversation=conv, sender=manufacturer, text=text)
            conv.save(update_fields=["updated_at"])


from .serializers import (
    ConversationSerializer, MessageSerializer, FavoriteSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        me = self.request.user
        return (
            Conversation.objects
            .filter(Q(participant_a=me) | Q(participant_b=me))
            .select_related("participant_a", "participant_b", "product")
            .prefetch_related("messages")
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        """Suhbat ochish yoki mavjudini qaytarish.
        body: { "user_id": <boshqa foydalanuvchi>, "product": <ixtiyoriy> }"""
        me = request.user
        other_id = request.data.get("user_id")
        product_id = request.data.get("product")
        if not other_id:
            return Response({"detail": "user_id kerak."}, status=400)
        if str(other_id) == str(me.id):
            return Response({"detail": "O'zingiz bilan suhbat ochib bo'lmaydi."}, status=400)
        try:
            other = User.objects.get(id=other_id)
        except User.DoesNotExist:
            return Response({"detail": "Foydalanuvchi topilmadi."}, status=404)

        a, b = Conversation.normalize(me, other)
        conv, _created = Conversation.objects.get_or_create(
            participant_a=a, participant_b=b,
            defaults={"product_id": product_id} if product_id else {},
        )
        ser = self.get_serializer(conv)
        return Response(ser.data, status=200)

    @action(detail=True, methods=["get"])
    def messages(self, request, pk=None):
        """Suhbatdagi barcha xabarlar + qarama-qarshi xabarlarni o'qildi deb belgilash."""
        conv = self.get_object()
        me = request.user
        # qarshi tomon xabarlarini o'qildi qilish
        conv.messages.filter(is_read=False).exclude(sender=me).update(is_read=True)
        msgs = conv.messages.select_related("sender").all()
        ser = MessageSerializer(msgs, many=True, context={"request": request})
        return Response(ser.data)

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        """Xabar yuborish. body: { "text": "..." }"""
        conv = self.get_object()
        text = (request.data.get("text") or "").strip()
        if not text:
            return Response({"detail": "Xabar bo'sh."}, status=400)
        msg = Message.objects.create(conversation=conv, sender=request.user, text=text)
        # suhbat updated_at yangilanadi (ordering uchun)
        conv.save(update_fields=["updated_at"])
        return Response(
            MessageSerializer(msg, context={"request": request}).data, status=201
        )


class UnreadCountView(APIView):
    """Pastki nav uchun umumiy o'qilmagan xabarlar soni."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        me = request.user
        count = Message.objects.filter(
            conversation__in=Conversation.objects.filter(
                Q(participant_a=me) | Q(participant_b=me)
            )
        ).filter(is_read=False).exclude(sender=me).count()
        return Response({"unread": count})


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related("product", "product__manufacturer")

    def create(self, request, *args, **kwargs):
        product_id = request.data.get("product")
        if not product_id:
            return Response({"detail": "product kerak."}, status=400)
        fav, created = Favorite.objects.get_or_create(
            user=request.user, product_id=product_id
        )
        ser = self.get_serializer(fav)
        return Response(ser.data, status=201 if created else 200)

    @action(detail=False, methods=["delete"], url_path="by-product/(?P<product_id>[^/.]+)")
    def by_product(self, request, product_id=None):
        Favorite.objects.filter(user=request.user, product_id=product_id).delete()
        return Response(status=204)
