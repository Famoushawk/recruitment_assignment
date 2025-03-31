import csv
import json
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
from .models import DataEntry
from django.db.models import Q
import io
import time
import threading
from django.core.paginator import Paginator

# Global variable to store upload progress
upload_progress = {
    'total_rows': 0,
    'processed_rows': 0,
    'status': 'idle',  # 'idle', 'in_progress', 'completed', 'error'
    'error': None,
    'columns': []
}


def reset_progress():
    """Reset the upload progress tracker"""
    global upload_progress
    upload_progress = {
        'total_rows': 0,
        'processed_rows': 0,
        'status': 'idle',
        'error': None,
        'columns': []
    }


def process_csv_in_background(file_content, delimiter):
    """Process CSV file in the background"""
    global upload_progress

    try:
        # Reset existing progress
        reset_progress()

        # Mark as in progress
        upload_progress['status'] = 'in_progress'

        # Count total rows first (needed for progress tracking)
        total_rows = 0
        for _ in csv.reader(io.StringIO(file_content), delimiter=delimiter):
            total_rows += 1

        # Subtract 1 for header row
        upload_progress['total_rows'] = total_rows - 1 if total_rows > 0 else 0

        # Reset file pointer
        csv_file = io.StringIO(file_content)
        csv_reader = csv.DictReader(csv_file, delimiter=delimiter)

        # Get columns
        columns = csv_reader.fieldnames if csv_reader.fieldnames else []
        upload_progress['columns'] = columns

        # Clear existing data
        with transaction.atomic():
            DataEntry.objects.all().delete()

        # Process in batches
        batch_size = 1000
        batch = []

        for row in csv_reader:
            # Clean up row data
            clean_row = {k: str(v).strip() if v is not None else '' for k, v in row.items()}
            batch.append(DataEntry(data=clean_row))

            # When batch is full, insert and update progress
            if len(batch) >= batch_size:
                with transaction.atomic():
                    DataEntry.objects.bulk_create(batch)

                upload_progress['processed_rows'] += len(batch)
                batch = []

        # Insert any remaining records
        if batch:
            with transaction.atomic():
                DataEntry.objects.bulk_create(batch)
            upload_progress['processed_rows'] += len(batch)

        # Mark as completed
        upload_progress['status'] = 'completed'

    except Exception as e:
        # Handle any errors
        upload_progress['status'] = 'error'
        upload_progress['error'] = str(e)


@csrf_exempt
@require_http_methods(["POST"])
def upload_file(request):
    """Start file upload processing"""
    try:
        file = request.FILES['file']
        if not file.name.endswith('.csv'):
            return JsonResponse({'error': 'Please upload a CSV file'}, status=400)

        # Read the file
        decoded_file = file.read().decode('utf-8')

        # Try to determine delimiter
        sample_line = decoded_file.split('\n')[0] if '\n' in decoded_file else decoded_file
        delimiter = ';' if ';' in sample_line else ','

        # Reset progress and start processing in background
        reset_progress()

        # Start background thread for processing
        thread = threading.Thread(
            target=process_csv_in_background,
            args=(decoded_file, delimiter)
        )
        thread.daemon = True
        thread.start()

        return JsonResponse({
            'message': 'File upload started',
            'status': 'processing'
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def get_upload_progress(request):
    """Get the current progress of an active upload"""
    global upload_progress
    return JsonResponse(upload_progress)


@csrf_exempt
@require_http_methods(["GET"])
def get_columns(request):
    """Get available columns from the database"""
    try:
        # First check if we have in-progress upload with columns
        global upload_progress
        if upload_progress['status'] in ['in_progress', 'completed'] and upload_progress['columns']:
            return JsonResponse({'columns': upload_progress['columns']})

        # If not, get from database
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
    """Search data with pagination"""
    try:
        data = json.loads(request.body)
        fields = data.get('fields', [])
        value = data.get('value', '')
        page = data.get('page', 1)
        page_size = data.get('page_size', 20)  # Default to 20 results per page

        if not fields:
            return JsonResponse({'error': 'Fields are required'}, status=400)

        # Handle empty search value
        if not value:
            return JsonResponse({
                'results': [],
                'total_count': 0,
                'page': page,
                'total_pages': 0
            })

        # Build query
        query = Q()
        for field in fields:
            clean_field = field.strip()
            query |= Q(**{f"data__{clean_field}__icontains": value})

        # Perform search
        results = DataEntry.objects.filter(query)

        # Get total count for pagination
        total_count = results.count()

        # Apply pagination
        paginator = Paginator(results, page_size)
        page_obj = paginator.get_page(page)

        # Prepare response
        response_data = {
            'results': [entry.data for entry in page_obj],
            'total_count': total_count,
            'page': page,
            'total_pages': paginator.num_pages
        }

        return JsonResponse(response_data, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def download_results(request):
    """Download search results as CSV"""
    try:
        fields = request.GET.getlist('fields')
        value = request.GET.get('value', '')

        if not fields:
            return JsonResponse({'error': 'Fields are required'}, status=400)

        # Build query
        query = Q()
        for field in fields:
            clean_field = field.strip()
            query |= Q(**{f"data__{clean_field}__icontains": value})

        # Perform search
        results = DataEntry.objects.filter(query)

        if not results.exists():
            return JsonResponse({'error': 'No results to download'}, status=404)

        # Get all column names from the first result
        first_entry = results.first()
        fieldnames = list(first_entry.data.keys())

        # Create CSV writer
        def generate_csv():
            buffer = io.StringIO()
            writer = csv.DictWriter(buffer, fieldnames=fieldnames)

            # Write header
            writer.writeheader()
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

            # Write rows in batches
            batch_size = 100
            for i in range(0, results.count(), batch_size):
                batch = results[i:i + batch_size]
                for entry in batch:
                    writer.writerow(entry.data)
                    yield buffer.getvalue()
                    buffer.seek(0)
                    buffer.truncate(0)

        # Create streaming response
        response = StreamingHttpResponse(
            generate_csv(),
            content_type='text/csv'
        )
        response['Content-Disposition'] = 'attachment; filename="search_results.csv"'

        return response

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
