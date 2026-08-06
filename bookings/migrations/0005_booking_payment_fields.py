from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0004_alter_booking_status_delete_message'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='advance_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='booking',
            name='payment_status',
            field=models.CharField(
                choices=[
                    ('not_requested', 'Not Requested'),
                    ('pending_upload', 'Pending Upload'),
                    ('submitted', 'Submitted'),
                    ('verified', 'Verified'),
                ],
                default='not_requested',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='booking',
            name='payment_screenshot',
            field=models.ImageField(blank=True, null=True, upload_to='payment_screenshots/'),
        ),
        migrations.AddField(
            model_name='booking',
            name='payment_uploaded_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
