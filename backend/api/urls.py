from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_file, name='upload_file'),
    path('search/', views.search_data, name='search_data'),
    path('columns/', views.get_columns, name='get_columns'),
] 