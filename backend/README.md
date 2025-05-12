## How to use

### Setup
1. Create `.env` file by copying data from `.env.example`:
```sh
cp .env.example .env
```

### Run
`docker-compose up -d`

Site available on 8081 port.

### Access
- Swagger: http://127.0.0.1:8081/api/docs
- Admin panel: http://127.0.0.1:8081/django/admin/

### Development
You can make any changes in code, they will appear automatically. If you want to execute something with manage.py use:

```sh
docker compose exec app python3 manage.py migrate
docker compose exec app python3 manage.py makemigrations
docker compose exec app python3 manage.py createsuperuser
```

and so on.
