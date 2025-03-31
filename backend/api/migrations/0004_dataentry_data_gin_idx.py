# Generated by Django 3.2.7 on 2025-03-31 22:09

import django.contrib.postgres.indexes
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_enable_pg_trgm'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='dataentry',
            index=django.contrib.postgres.indexes.GinIndex(fields=['data'], name='data_gin_idx'),
        ),
    ]
