import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()
from core.models import User, Product

firma, _ = User.objects.get_or_create(
    email="firma@test.uz",
    defaults={"username": "firma@test.uz", "full_name": "Zavod A", "role": "ishlab_chiqaruvchi"},
)
firma.role = "ishlab_chiqaruvchi"
firma.phone = "+998901234567"
firma.set_password("parol1234")
firma.save()

# Ikkinchi ishlab chiqaruvchi (xilma-xillik uchun)
firma2, _ = User.objects.get_or_create(
    email="texno@test.uz",
    defaults={"username": "texno@test.uz", "full_name": "Texno Plus", "role": "ishlab_chiqaruvchi"},
)
firma2.role = "ishlab_chiqaruvchi"
firma2.phone = "+998907654321"
firma2.set_password("parol1234")
firma2.save()

seller, _ = User.objects.get_or_create(
    email="dokon@test.uz",
    defaults={"username": "dokon@test.uz", "full_name": "Dokon B", "role": "sotuvchi"},
)
seller.role = "sotuvchi"
seller.phone = "+998909999999"
seller.set_password("parol1234")
seller.save()

Product.objects.all().delete()

# (nomi, kategoriya, narx, birlik, zaxira, rasm, ishlab chiqaruvchi)
demo = [
    ("Coca-Cola 1.5L", "Ichimliklar", "12000", "dona", 500, "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500", firma),
    ("Mineral suv 0.5L", "Ichimliklar", "3000", "dona", 1200, "https://images.unsplash.com/photo-1560023907-5f339617ea30?w=500", firma),
    ("Shokolad plitka", "Shirinliklar", "15000", "dona", 300, "https://images.unsplash.com/photo-1511381939415-e44015466834?w=500", firma),
    ("Pechenye 200g", "Shirinliklar", "8000", "paket", 400, "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500", firma),
    ("Guruch Lazer 5kg", "Oziq-ovqat", "65000", "qop", 150, "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500", firma),
    ("Makaron 400g", "Oziq-ovqat", "9000", "paket", 600, "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=500", firma),
    ("Yog' 1L", "Oziq-ovqat", "28000", "dona", 200, "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500", firma),
    ("Choy Akbar 100g", "Ichimliklar", "18000", "quti", 250, "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500", firma),
    ("Sovun 100g", "Maishiy", "5000", "dona", 800, "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=500", firma),
    ("Qahva 250g", "Ichimliklar", "45000", "paket", 180, "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500", firma),
    # Texno Plus mahsulotlari
    ("Smartfon X12", "Elektronika", "2890000", "dona", 60, "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500", firma2),
    ("Simsiz quloqchin", "Elektronika", "320000", "dona", 140, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", firma2),
    ("Konditsioner Inverter", "Elektronika", "3199000", "dona", 35, "https://images.unsplash.com/photo-1631545806609-26c50ccbf3c1?w=500", firma2),
    ("Notebook Pro 14", "Elektronika", "8500000", "dona", 25, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500", firma2),
    ("Smart soat", "Elektronika", "780000", "dona", 90, "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500", firma2),
    ("Futbolka Premium", "Kiyim", "89000", "dona", 320, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", firma2),
    ("Krossovka Sport", "Kiyim", "450000", "juft", 110, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", firma2),
    ("Sport sumka", "Kiyim", "210000", "dona", 75, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500", firma2),
]

centers = {
    "firma@test.uz": (41.3111, 69.2797),
    "texno@test.uz": (41.3263, 69.2955),
}

for idx, (name, cat, price, unit, stock, img, mf) in enumerate(demo):
    c_lat, c_lng = centers.get(mf.email, (41.3111, 69.2797))
    lat = round(c_lat + ((idx % 5) - 2) * 0.0021, 6)
    lng = round(c_lng + ((idx % 4) - 1.5) * 0.0022, 6)
    Product.objects.create(
        manufacturer=mf, name=name, category=cat,
        price=price, unit=unit, stock=stock, image_url=img,
        producer_phone="+998901234567" if mf.email == "firma@test.uz" else "+998907654321",
        location_address="Toshkent sh., Yunusobod tumani",
        latitude=lat, longitude=lng,
        description=f"{name} — sifatli mahsulot, ishlab chiqaruvchidan to'g'ridan-to'g'ri.",
    )

print(f"Seeded {Product.objects.count()} mahsulot, {Product.objects.values('category').distinct().count()} kategoriya")
print("Hisoblar: dokon@test.uz (sotuvchi), firma@test.uz & texno@test.uz (ishlab chiqaruvchi) — parol: parol1234")
