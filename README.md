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
