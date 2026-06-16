from decimal import Decimal
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from .models import User, Product, Request, Conversation, Message, Favorite
from .categories import PRODUCT_CATEGORIES


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "role", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        # username talab qilinadi (USERNAME_FIELD=email bo'lsa ham)
        validated_data["username"] = validated_data["email"]
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "role"]


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    phone = serializers.CharField(required=False, allow_blank=True, write_only=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        phone = (attrs.get("phone") or "").strip()
        data = super().validate(attrs)
        if phone:
            if self.user.phone and phone != self.user.phone:
                raise AuthenticationFailed("No active account found with the given credentials")
            if not self.user.phone:
                self.user.phone = phone
                self.user.save(update_fields=["phone"])
        data["role"] = self.user.role
        data["full_name"] = self.user.full_name
        data["email"] = self.user.email
        data["user_id"] = self.user.id
        data["phone"] = self.user.phone
        return data


class ProductSerializer(serializers.ModelSerializer):
    manufacturer_name = serializers.CharField(
        source="manufacturer.full_name", read_only=True
    )
    image_url = serializers.SerializerMethodField()
    image = serializers.FileField(write_only=True, required=False, allow_null=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)

    class Meta:
        model = Product
        fields = [
            "id", "name", "description", "price", "unit", "stock",
            "image_url", "image", "category", "producer_phone",
            "location_address", "latitude", "longitude",
            "manufacturer", "manufacturer_name", "created_at",
        ]
        read_only_fields = ["manufacturer", "created_at"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        return obj.resolved_image_url(request)

    def validate_image(self, value):
        if value and hasattr(value, "content_type"):
            if not str(value.content_type).startswith("image/"):
                raise serializers.ValidationError("Faqat rasm faylini yuklang.")
        return value

    def validate_category(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError("Kategoriya tanlanishi shart.")
        value = str(value).strip()
        if value in PRODUCT_CATEGORIES:
            return value
        instance = getattr(self, "instance", None)
        if instance and instance.category == value:
            return value
        raise serializers.ValidationError("Noto'g'ri kategoriya tanlandi.")

    def validate_producer_phone(self, value):
        cleaned = (value or "").strip()
        if not cleaned:
            request = self.context.get("request")
            fallback = (getattr(request, "user", None) and request.user.phone) or ""
            if not fallback:
                raise serializers.ValidationError("Telefon raqami majburiy.")
            return fallback
        return cleaned

    def validate(self, attrs):
        lat = attrs.get("latitude")
        lng = attrs.get("longitude")
        if lat is None:
            raise serializers.ValidationError({"latitude": "Latitude majburiy."})
        if lng is None:
            raise serializers.ValidationError({"longitude": "Longitude majburiy."})
        if not (-90 <= float(lat) <= 90):
            raise serializers.ValidationError({"latitude": "Latitude noto'g'ri qiymat."})
        if not (-180 <= float(lng) <= 180):
            raise serializers.ValidationError({"longitude": "Longitude noto'g'ri qiymat."})
        return attrs


class RequestSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.full_name", read_only=True)
    seller_email = serializers.CharField(source="seller.email", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_unit = serializers.CharField(source="product.unit", read_only=True)
    product_image = serializers.SerializerMethodField()
    manufacturer_id = serializers.IntegerField(
        source="product.manufacturer_id", read_only=True
    )
    manufacturer_name = serializers.CharField(
        source="product.manufacturer.full_name", read_only=True
    )

    class Meta:
        model = Request
        fields = [
            "id", "seller", "seller_name", "seller_email",
            "product", "product_name", "product_unit", "product_image",
            "manufacturer_id", "manufacturer_name",
            "quantity", "note", "status", "reject_reason", "responded_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "seller", "status", "reject_reason", "responded_at",
            "created_at", "updated_at",
        ]

    def get_product_image(self, obj):
        request = self.context.get("request")
        return obj.product.resolved_image_url(request)

    def validate_quantity(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Miqdor 0 dan katta bo'lishi kerak.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        product = attrs.get("product") or getattr(self.instance, "product", None)
        quantity = attrs.get("quantity")
        if not product or quantity is None:
            return attrs

        unit = (product.unit or "").strip().lower()
        discrete_units = {"dona", "ta", "pcs", "piece", "quti", "paket", "box"}
        if unit in discrete_units and quantity != quantity.to_integral_value():
            raise serializers.ValidationError(
                {"quantity": f"{product.unit} uchun butun son kiriting (masalan: 1, 2, 3)."}
            )

        if quantity.as_tuple().exponent < -3:
            raise serializers.ValidationError({"quantity": "Maksimal 3 xonali kasrga ruxsat beriladi."})

        if quantity > Decimal(str(product.stock)):
            raise serializers.ValidationError({"quantity": "Mavjud zaxiradan oshib ketdi."})
        return attrs


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "sender_name", "text",
                  "is_read", "is_mine", "created_at"]
        read_only_fields = ["sender", "is_read", "created_at", "conversation"]

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and obj.sender_id == request.user.id)


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "other_user", "last_message", "unread_count",
                  "product", "product_name", "updated_at"]

    def _other(self, obj):
        me = self.context["request"].user
        return obj.participant_b if obj.participant_a_id == me.id else obj.participant_a

    def get_other_user(self, obj):
        u = self._other(obj)
        return {"id": u.id, "full_name": u.full_name, "email": u.email, "role": u.role}

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if not msg:
            return None
        return {"text": msg.text, "created_at": msg.created_at,
                "sender_id": msg.sender_id}

    def get_unread_count(self, obj):
        me = self.context["request"].user
        return obj.messages.filter(is_read=False).exclude(sender=me).count()


class FavoriteSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "product", "product_detail", "created_at"]
        read_only_fields = ["created_at"]
