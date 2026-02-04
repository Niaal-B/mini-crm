# Mini CRM Project

A production-minded CRM application built with Django, Django Rest Framework (DRF), and a Vanilla JS frontend.

## Features
- **JWT Authentication**: Secure login with access/refresh tokens.
- **Master Data**: Manage Organizations, Contacts, and Products.
- **Dynamic Pricing**: Size-specific pricing with base price fallback.
- **Order Flow**: Real-time price calculation, cart merging rules, and order ID generation.
- **Docker Ready**: One-command setup using Docker Compose.
- **Clean UI**: Premium aesthetics using Vanilla JS and Custom CSS.

## Tech Stack
- **Backend**: Django 6.0+, DRF, PostgreSQL (Docker) / SQLite (Local).
- **Frontend**: Vanilla JavaScript (SPA), Semantic HTML, Vanilla CSS.
- **Auth**: djangorestframework-simplejwt.
- **DevOps**: Docker, Docker Compose.

## Local Setup

1. **Clone & Setup Venv**:
   ```bash
   git clone git@github.com:Niaal-B/mini-crm.git
   cd mini_crm
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Run Migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Start Server**:
   ```bash
   python manage.py runserver
   ```

## Docker Setup
```bash
docker-compose up --build
```

## Running Tests
```bash
python manage.py test crm_core
```
