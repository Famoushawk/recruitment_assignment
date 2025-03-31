from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from ..models import DataEntry, FileInfo
from .state import upload_progress, active_file_id

@csrf_exempt
@require_http_methods(["GET"])
def get_columns(request):
    """Get available columns from the database"""
    try:
        # First check if we have in-progress upload with columns
        if upload_progress['status'] in ['in_progress', 'completed'] and upload_progress['columns']:
            return JsonResponse({
                'columns': upload_progress['columns'],
                'current_file': upload_progress['current_file']
            })

        # If not, get from active file
        if active_file_id:
            file_info = FileInfo.objects.get(id=active_file_id)
            sample_entry = DataEntry.objects.filter(file=file_info).first()
            
            if sample_entry:
                return JsonResponse({
                    'columns': list(sample_entry.data.keys()),
                    'current_file': file_info.filename
                })

        return JsonResponse({
            'columns': [],
            'current_file': None
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400) 