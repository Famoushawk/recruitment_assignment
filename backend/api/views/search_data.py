import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Q
from ..models import DataEntry, FileInfo

@csrf_exempt
@require_http_methods(["POST"])
def search_data(request):
    """Search data with pagination and relevance sorting"""
    try:
        data = json.loads(request.body)
        search_terms = data.get('search_terms', [])
        fields = data.get('fields', [])
        page = data.get('page', 1)
        page_size = data.get('page_size', 20)
        file_id = data.get('file_id')
        
        print(f"Search request - terms: {search_terms}, fields: {fields}, file_id: {file_id}")
        
        if not search_terms or not fields:
            return JsonResponse({
                'error': 'Search terms and fields are required'
            }, status=400)
            
        if not file_id:
            return JsonResponse({'error': 'File ID is required'}, status=400)
            
        try:
            file_info = FileInfo.objects.get(id=file_id)
        except FileInfo.DoesNotExist:
            return JsonResponse({'error': 'File not found'}, status=404)

        query = DataEntry.objects.filter(file=file_info)
        
        search_conditions = Q()
        
        for term in search_terms:
            term_condition = Q()
            for field in fields:
                field_variations = [field, field.replace(' ', '')]
                for field_name in field_variations:
                    json_field_lookup = f"data__{field_name}__icontains"
                    term_condition |= Q(**{json_field_lookup: term})
            
            search_conditions &= term_condition

        query = query.filter(search_conditions)
        
        print(f"Query SQL: {str(query.query)}")

        total_count = query.count()
        print(f"Total results found: {total_count}")
        
        total_pages = (total_count + page_size - 1) // page_size
        offset = (page - 1) * page_size

        results = query[offset:offset + page_size]

        formatted_results = []
        for entry in results:
            result = {
                'id': entry.id,
                'data': entry.data,
                'created_at': entry.created_at.isoformat(),
                'file': entry.file.filename if entry.file else None
            }
            formatted_results.append(result)

        response_data = {
            'results': formatted_results,
            'total_count': total_count,
            'total_pages': total_pages,
            'page': page,
            'page_size': page_size
        }
        
        print(f"Sending response with {len(formatted_results)} results")
        return JsonResponse(response_data)

    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        print(f"Search error: {str(e)}")
        return JsonResponse({
            'error': str(e)
        }, status=500) 