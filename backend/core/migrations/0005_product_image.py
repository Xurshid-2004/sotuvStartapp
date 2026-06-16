from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_request_reject_reason_request_responded_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="image",
            field=models.FileField(blank=True, null=True, upload_to="products/"),
        ),
    ]
