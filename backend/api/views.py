import csv
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import DataEntry
from django.db.models import Q
import io

@csrf_exempt
@require_http_methods(["POST"])
def upload_file(request):
    try:
        file = request.FILES['file']
        if not file.name.endswith('.csv'):
            return JsonResponse({'error': 'Please upload a CSV file'}, status=400)

        # Read the CSV file
        decoded_file = file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded_file))
        
        # Get the column names
        columns = csv_reader.fieldnames

        # Store each row in the database
        for row in csv_reader:
            DataEntry.objects.create(data=row)

        return JsonResponse({
            'message': 'File uploaded successfully',
            'columns': columns
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def get_columns(request):
    try:
        # Get a sample entry to extract columns
        sample_entry = DataEntry.objects.first()
        if not sample_entry:
            return JsonResponse({'columns': []})
        
        columns = list(sample_entry.data.keys())
        return JsonResponse({'columns': columns})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def search_data(request):
    try:
        data = json.loads(request.body)
        field = data.get('field')
        value = data.get('value')

        if not field or not value:
            return JsonResponse({'error': 'Field and value are required'}, status=400)

        # Perform case-insensitive partial search using contains
        # We need to use the JSONField's containment operators
        query = Q(**{f"data__{field}__icontains": value})
        results = DataEntry.objects.filter(query)
        
        # Convert results to list of dictionaries
        response_data = [entry.data for entry in results]
        
        return JsonResponse(response_data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400) 