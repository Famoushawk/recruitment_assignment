from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from ..models import FileInfo

@csrf_exempt
@require_http_methods(["GET"])
def list_files(request):
    """Get list of uploaded files"""
    try:
        files = FileInfo.objects.all().order_by('-upload_date')
        return JsonResponse({
            'files': [{
                'id': f.id,
                'filename': f.filename,
                'upload_date': f.upload_date.isoformat(),
                'row_count': f.row_count,
                'is_active': f.is_active
            } for f in files]
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400) 