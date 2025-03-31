# Global variable to store upload progress and active file
upload_progress = {
    'total_rows': 0,
    'processed_rows': 0,
    'status': 'idle',  # 'idle', 'in_progress', 'completed', 'error'
    'error': None,
    'columns': [],
    'current_file': None
}

# Store the ID of the currently active file
active_file_id = None

def reset_progress():
    """Reset the upload progress tracker"""
    global upload_progress
    upload_progress = {
        'total_rows': 0,
        'processed_rows': 0,
        'status': 'idle',
        'error': None,
        'columns': [],
        'current_file': None
    } 