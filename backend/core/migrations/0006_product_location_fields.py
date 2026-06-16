from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_product_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="latitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="product",
            name="location_address",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="product",
            name="longitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="product",
            name="producer_phone",
            field=models.CharField(blank=True, default="", max_length=30),
        ),
    ]
