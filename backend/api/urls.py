from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_file, name='upload_file'),
    path('search/', views.search_data, name='search_data'),
    path('columns/', views.get_columns, name='get_columns'),
    path('download-results/', views.download_results, name='download_results'),
    path('suggestions/', views.search_suggestions, name='search_suggestions'),
    path('files/', views.list_files, name='list_files'),
    path('files/select/', views.select_file, name='select_file'),
]