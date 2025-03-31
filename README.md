### Backend
- Python 3.9
- FastAPI
- SQLAlchemy
- PostgreSQL

### Frontend
- Vanilla JavaScript (ES6+)
- CSS3 with CSS Variables
- HTML5
- Nginx (for serving static files)

## Prerequisites

- Docker and Docker Compose
- Git

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd recruitment_assignment
```

2. Start the application using Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:80

## Project Structure

```
recruitment_assignment/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── js/
│       │   └── modules/
│       ├── styles/
│       │   └── components/
│       └── index.html
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Development

### Backend Development
- The backend uses FastAPI for the API framework
- SQLAlchemy for database operations
- Pydantic for data validation
- Alembic for database migrations

### Frontend Development
- Modular JavaScript architecture
- Component-based CSS organization
- Vanilla JavaScript without external dependencies
- Responsive design principles
