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
        fields = data.get('fields', [])
        value = data.get('value', '')
        page = data.get('page', 1)
        page_size = data.get('page_size', 20)
        file_id = data.get('file_id')
        
        if not fields:
            return JsonResponse({'error': 'Fields are required'}, status=400)
            
        if not file_id:
            return JsonResponse({'error': 'File ID is required'}, status=400)
            
        try:
            file_info = FileInfo.objects.get(id=file_id)
        except FileInfo.DoesNotExist:
            return JsonResponse({'error': 'File not found'}, status=404)

        # Build the query
        query = Q(file=file_info)  # Base query for file filter
        
        # Build the fields query
        field_queries = Q()
        for field in fields:
            field_queries |= Q(**{f"data__{field.strip()}__icontains": value})
        
        # Combine queries
        final_query = query & field_queries

        print(f"Search query: File ID={file_id}, Fields={fields}, Value='{value}'")  # Debug log
        
        # Execute the query
        results = DataEntry.objects.filter(final_query)
        print(f"Found {results.count()} results")  # Debug log

        # Sort results by relevance
        def calculate_relevance(entry):
            score = 0
            search_value = value.lower()
            entry_data = entry.data

            for field in fields:
                if field in entry_data and entry_data[field]:
                    field_value = str(entry_data[field]).lower()
                    
                    # Exact match gets highest score
                    if field_value == search_value:
                        score += 200 if field.lower() == 'product' else 150
                    # Prefix match gets high score
                    elif field_value.startswith(search_value):
                        score += 150 if field.lower() == 'product' else 100
                    # Contains match gets base score
                    elif search_value in field_value:
                        score += 100 if field.lower() == 'product' else 50

            return score

        # Sort results by relevance
        sorted_results = sorted(
            results,
            key=calculate_relevance,
            reverse=True
        )

        # Paginate results
        total_count = len(sorted_results)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_results = sorted_results[start_idx:end_idx]

        # Prepare response
        response_data = {
            'results': [
                {
                    **entry.data,
                    '_relevance': calculate_relevance(entry)
                }
                for entry in paginated_results
            ],
            'total_count': total_count,
            'page': page,
            'total_pages': (total_count + page_size - 1) // page_size
        }

        print(f"Returning {len(paginated_results)} results")  # Debug log
        return JsonResponse(response_data, safe=False)

    except Exception as e:
        print(f"Search error: {str(e)}")  # Debug log
        return JsonResponse({'error': str(e)}, status=400) 