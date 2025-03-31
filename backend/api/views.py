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

        # Clear existing data
        DataEntry.objects.all().delete()

        # Read the CSV file
        decoded_file = file.read().decode('utf-8')

        # Try to determine delimiter - handle both comma and semicolon
        sample_line = decoded_file.split('\n')[0] if '\n' in decoded_file else decoded_file
        delimiter = ';' if ';' in sample_line else ','

        csv_reader = csv.DictReader(io.StringIO(decoded_file), delimiter=delimiter)

        # Get the column names
        columns = csv_reader.fieldnames if csv_reader.fieldnames else []

        # Store each row in the database
        for row in csv_reader:
            # Clean up row data - ensure all values are strings
            clean_row = {k: str(v).strip() if v is not None else '' for k, v in row.items()}
            DataEntry.objects.create(data=clean_row)

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
            # Return empty columns list if no data
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
        fields = data.get('fields', [])
        value = data.get('value', '')

        if not fields:
            return JsonResponse({'error': 'Fields are required'}, status=400)

        # Handle empty search value
        if not value:
            return JsonResponse([])

        # Build OR query for all selected fields
        query = Q()
        for field in fields:
            # Handle fields with special characters or spaces
            clean_field = field.strip()
            query |= Q(**{f"data__{clean_field}__icontains": value})

        # Perform the search across all selected fields
        results = DataEntry.objects.filter(query)

        # Convert results to list of dictionaries
        response_data = [entry.data for entry in results]

        return JsonResponse(response_data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)