# Deployment Guide

## Production Checklist

### 1. Environment Variables
Ensure the following are set in your production environment:
- `DEBUG=False`
- `SECRET_KEY` (Strong, unique key)
- `DATABASE_URL`
- `ALLOWED_HOSTS`

### 2. Static Files
In production, you must collect static files:
```bash
python manage.py collectstatic --noinput
```

### 3. Web Server (Gunicorn)
Use Gunicorn to serve the Django application:
```bash
gunicorn mini_crm.wsgi:application --bind 0.0.0.0:8000
```

### 4. Reverse Proxy (Nginx)
Nginx should be used to serve static files and proxy requests to Gunicorn.
Sample Nginx config:
```nginx
server {
    listen 80;
    server_name example.com;

    location /static/ {
        alias /app/staticfiles/;
    }

    location / {
        proxy_pass http://web:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
