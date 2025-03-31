from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Q
from ..models import DataEntry

@csrf_exempt
@require_http_methods(["GET"])
def search_suggestions(request):
    """Get search suggestions based on key columns"""
    try:
        prefix = request.GET.get('q', '').strip()
        if not prefix or len(prefix) < 2:
            return JsonResponse({'suggestions': []})

        priority_fields = ['Product', 'IndianCompany', 'ForeignCompany', 'Indian Company', 'Foreign Company']

        query = Q()
        for field in priority_fields:
            query |= Q(**{f"data__{field}__istartswith": prefix})

        suggestions = []
        limit = 10

        for field in priority_fields:
            if len(suggestions) >= limit:
                break

            matches = DataEntry.objects.filter(**{f"data__{field}__istartswith": prefix}).distinct()

            field_values = set()
            for entry in matches:
                if field in entry.data and entry.data[field]:
                    value = str(entry.data[field]).strip()
                    if value.lower().startswith(prefix.lower()):
                        field_values.add(value)

            for value in list(field_values)[:limit - len(suggestions)]:
                if value not in [s['value'] for s in suggestions]:
                    suggestions.append({
                        'value': value,
                        'field': field,
                        'display': f"{value} ({field})"
                    })

            if len(suggestions) >= limit:
                break

        return JsonResponse({'suggestions': suggestions})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400) 