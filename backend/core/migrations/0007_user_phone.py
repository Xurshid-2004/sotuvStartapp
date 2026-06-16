from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0006_product_location_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="phone",
            field=models.CharField(blank=True, default="", max_length=30),
        ),
    ]
