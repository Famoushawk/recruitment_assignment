from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from ..models import FileInfo

@require_http_methods(['DELETE'])
def delete_file(request, file_id):
    """Delete a file and its associated entries"""
    try:
        file_info = FileInfo.objects.get(id=file_id)
        
        # Delete all associated entries first
        file_info.entries.all().delete()
        
        # Delete the file info
        file_info.delete()
        
        return JsonResponse({'message': 'File deleted successfully'})
        
    except FileInfo.DoesNotExist:
        return JsonResponse({'error': 'File not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 