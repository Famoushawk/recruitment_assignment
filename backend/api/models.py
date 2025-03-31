from django.db import models
from django.contrib.postgres.indexes import GinIndex

class FileInfo(models.Model):
    filename = models.CharField(max_length=255)
    upload_date = models.DateTimeField(auto_now_add=True)
    row_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.filename} (uploaded {self.upload_date})"

class DataEntry(models.Model):
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    file = models.ForeignKey(FileInfo, on_delete=models.CASCADE, related_name='entries', null=True, blank=True)

    def __str__(self):
        return f"Entry {self.id} from {self.file.filename if self.file else 'unknown'}"

    class Meta:
        indexes = [
            # GIN index for the entire JSON field
            GinIndex(fields=['data'], name='data_gin_idx'),
        ] 