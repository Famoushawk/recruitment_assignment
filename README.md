# Excel Search Application

A web-based application that allows users to upload Excel files and perform advanced searches across the data. Built with Django, PostgreSQL, and a modern frontend interface.

## Features

- Excel file upload and processing
- Advanced search functionality with multiple terms and fields
- Auto-complete suggestions
- Real-time search results
- Responsive UI
- Field selection for targeted searches
- Pagination for large result sets

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/recruitment_assignment.git
   cd recruitment_assignment
   ```

2. Build and start the containers:
   ```bash
   docker-compose up --build -d
   ```

3. Access the application:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000

## Usage

1. Upload Excel Files:
   - Click the "Upload" button
   - Select your Excel file
   - Wait for the upload and processing to complete

2. Search Data:
   - Enter search terms in the search box (comma-separated for multiple terms)
   - Select the fields you want to search in
   - Click "Search" or press Enter
   - Use the auto-complete suggestions for faster searching

3. View Results:
   - Results are displayed in cards showing matching data
   - Navigate through pages using the pagination controls
   - Matching terms are highlighted in the results

## Architecture

The application consists of three main components:

1. Frontend:
   - Nginx server serving static files
   - Modern JavaScript for dynamic interactions
   - Responsive CSS design

2. Backend:
   - Django REST API
   - Excel file processing
   - Search functionality with PostgreSQL

3. Database:
   - PostgreSQL with JSON field support
   - GIN indexing for fast searches

## Important Notes

- The database starts empty when first set up
- Uploaded files and data are stored locally and not shared between installations
- Each new installation requires uploading files to search through

## Development

To make changes to the code:

1. Frontend changes:
   - Edit files in `frontend/src/`
   - Changes are reflected immediately due to volume mounting

2. Backend changes:
   - Edit files in `backend/`
   - The Django development server will reload automatically

## Troubleshooting

1. If the application isn't accessible:
   ```bash
   docker-compose ps  # Check if all containers are running
   docker-compose logs  # Check for any error messages
   ```

2. To reset the database:
   ```bash
   docker-compose down -v  # Remove containers and volumes
   docker-compose up -d  # Start fresh
   ```

3. Common issues:
   - Port conflicts: Make sure ports 8080 and 8000 are available
   - Database connection: Ensure the database container is running
   - File permissions: Check if uploaded files directory is writable

## License

[Your chosen license]

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
