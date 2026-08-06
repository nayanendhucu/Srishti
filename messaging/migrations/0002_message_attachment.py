from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('messaging', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='message',
            name='text',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='message',
            name='attachment',
            field=models.FileField(blank=True, null=True, upload_to='message_attachments/'),
        ),
        migrations.AddField(
            model_name='message',
            name='attachment_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='message',
            name='attachment_content_type',
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
