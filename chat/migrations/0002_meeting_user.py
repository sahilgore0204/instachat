# Generated by Django 3.1.5 on 2021-07-11 04:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='meeting',
            name='user',
            field=models.CharField(default='None', max_length=100),
        ),
    ]