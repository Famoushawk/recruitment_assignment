from django.db import models

class DataEntry(models.Model):
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Entry {self.id} created at {self.created_at}" 