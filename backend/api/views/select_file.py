import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from ..models import FileInfo

@csrf_exempt
@require_http_methods(["POST"])
def select_file(request):
    """Select a file as active for searching"""
    try:
        data = json.loads(request.body)
        file_id = data.get('file_id')
        
        if not file_id:
            return JsonResponse({'error': 'File ID is required'}, status=400)
        
        file_info = FileInfo.objects.get(id=file_id)
        
        FileInfo.objects.all().update(is_active=False)
        
        file_info.is_active = True
        file_info.save()
        
        columns = []
        if file_info.entries.exists():
            first_entry = file_info.entries.first()
            if first_entry and first_entry.data:
                columns = list(first_entry.data.keys())
        
        return JsonResponse({
            'message': 'File selected successfully',
            'filename': file_info.filename,
            'columns': columns
        })
        
    except FileInfo.DoesNotExist:
        return JsonResponse({'error': 'File not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 