# Biometry Project

This project consists of multiple services working together:

## Services

### Backend (Django)
A Django-based API service with the following features:
- Swagger API documentation
- Django Admin interface
- Database interactions
- RESTful API endpoints

### Frontend (React)
A React-based web application that provides the user interface.

### Contracts
Smart contracts for blockchain integration using Account Abstraction (AA) pattern.

### Infrastructure
- PostgreSQL database
- Redis for caching
- Nginx for web serving

## Setup and Installation

1. Clone the repository
2. Create `.env` file by copying from `.env.example`:
```sh
cp .env.example .env
```
3. Set up environment variables for both backend and frontend:
```sh
# Backend environment setup
cd backend
cp .env.example .env
# Edit .env file with appropriate values

# Frontend environment setup
cd ../frontend
cp .env.example .env
# Edit .env file with appropriate values
```
4. Return to the project root
```sh
cd ..
```
5. Adjust configuration in the main `.env` file if needed

## Running the Application

Start all services with Docker Compose:
```sh
docker-compose up -d
```

## Accessing Services

### Backend
- Main API: http://127.0.0.1:8081
- Swagger Documentation: http://127.0.0.1:8081/api/docs
- Admin Panel: http://127.0.0.1:8081/django/admin/

### Frontend
- Web Interface: http://localhost:3000

## Development

### Backend
You can make code changes and they will be applied automatically. For Django management commands:
```sh
docker compose exec app python3 manage.py migrate
docker compose exec app python3 manage.py makemigrations
docker compose exec app python3 manage.py createsuperuser
```

### Frontend
Use the following commands for frontend development:
```sh
# Start development server
npm run start

# For Windows
npm run win-start
```

### Contracts
Smart contracts setup:
1. Navigate to the contracts directory:
```sh
cd contracts
```
2. Create `.env` file from template:
```sh
cp .env.example .env
```
3. Configure your private key and RPC URL in the `.env` file

## Project Structure

```
biometry/
├── backend/         # Django application
├── frontend/        # React application
├── contracts/       # Smart contracts
└── compose.yaml     # Docker Compose configuration
```

For more detailed information, check the README files in each service directory.
