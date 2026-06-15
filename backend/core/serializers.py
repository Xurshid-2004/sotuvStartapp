from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Product, Request, Conversation, Message, Favorite


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role", "password"]

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
        fields = ["id", "email", "full_name", "role"]


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["role"] = self.user.role
        data["full_name"] = self.user.full_name
        data["email"] = self.user.email
        data["user_id"] = self.user.id
        return data


class ProductSerializer(serializers.ModelSerializer):
    manufacturer_name = serializers.CharField(
        source="manufacturer.full_name", read_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id", "name", "description", "price", "unit", "stock",
            "image_url", "category",
            "manufacturer", "manufacturer_name", "created_at",
        ]
        read_only_fields = ["manufacturer", "created_at"]


class RequestSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.full_name", read_only=True)
    seller_email = serializers.CharField(source="seller.email", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_unit = serializers.CharField(source="product.unit", read_only=True)
    product_image = serializers.CharField(source="product.image_url", read_only=True)
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
