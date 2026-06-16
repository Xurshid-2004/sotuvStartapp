from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Tizim foydalanuvchisi: sotuvchi yoki ishlab chiqaruvchi."""
    SOTUVCHI = "sotuvchi"
    ISHLAB_CHIQARUVCHI = "ishlab_chiqaruvchi"
    ROLE_CHOICES = [
        (SOTUVCHI, "Sotuvchi"),
        (ISHLAB_CHIQARUVCHI, "Ishlab chiqaruvchi"),
    ]

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True, default="")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=SOTUVCHI)
    full_name = models.CharField(max_length=150, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.email} ({self.role})"


class Product(models.Model):
    """Ishlab chiqaruvchi e'lon qiladigan mahsulot."""
    manufacturer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="products",
        limit_choices_to={"role": User.ISHLAB_CHIQARUVCHI},
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.CharField(max_length=30, default="dona")
    stock = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    image_url = models.URLField(blank=True, default="")  # tashqi havola (seed / eski ma'lumot)
    image = models.FileField(upload_to="products/", blank=True, null=True)  # galereyadan yuklangan
    category = models.CharField(max_length=60, blank=True, default="")
    producer_phone = models.CharField(max_length=30, blank=True, default="")
    location_address = models.CharField(max_length=255, blank=True, default="")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def resolved_image_url(self, request=None):
        """Yuklangan rasm yoki tashqi URL — frontend uchun bitta manba."""
        if self.image:
            url = self.image.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return self.image_url or ""

    def __str__(self):
        return self.name


class Request(models.Model):
    """Sotuvchidan ishlab chiqaruvchiga mahsulot so'rovi (murojaat)."""
    YANGI = "yangi"
    QABUL = "qabul_qilindi"
    YUBORILDI = "yuborildi"
    RAD = "rad_etildi"
    STATUS_CHOICES = [
        (YANGI, "Yangi"),
        (QABUL, "Qabul qilindi"),
        (YUBORILDI, "Yuborildi"),
        (RAD, "Rad etildi"),
    ]

    seller = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_requests",
        limit_choices_to={"role": User.SOTUVCHI},
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="requests",
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    note = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=YANGI)
    reject_reason = models.TextField(blank=True, default="")  # rad etilganda sabab
    responded_at = models.DateTimeField(null=True, blank=True)  # firma javob bergan vaqt
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.seller.email} -> {self.product.name} x{self.quantity}"


class Conversation(models.Model):
    """Ikki foydalanuvchi (sotuvchi va ishlab chiqaruvchi) o'rtasidagi suhbat.
    Ixtiyoriy ravishda biror mahsulot/buyurtmaga bog'liq bo'lishi mumkin."""
    participant_a = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="conversations_a"
    )
    participant_b = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="conversations_b"
    )
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="conversations"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # oxirgi xabar vaqti

    class Meta:
        ordering = ["-updated_at"]
        # Bir juftlik o'rtasida bitta suhbat
        unique_together = ("participant_a", "participant_b")

    def __str__(self):
        return f"{self.participant_a.email} <-> {self.participant_b.email}"

    @staticmethod
    def normalize(u1, u2):
        """Suhbatni topishda tartibni barqaror qilish uchun id bo'yicha saralash."""
        return (u1, u2) if u1.id <= u2.id else (u2, u1)


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages")
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.email}: {self.text[:30]}"


class Favorite(models.Model):
    """Sotuvchining sevimli mahsulotlari."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "product")
        ordering = ["-created_at"]
