from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0005_booking_payment_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='delivery_address',
            field=models.TextField(blank=True),
        ),
    ]
