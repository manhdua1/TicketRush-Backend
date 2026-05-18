# Overview

TicketRush is a full-stack, Dockerized high-concurrency event ticketing platform built with Spring Boot, Next.js, MySQL, and Redis for INT3306 - Web Application Development @ VNU-UET.

The system supports event discovery, real-time seat selection, temporary seat locking, virtual queueing for high-traffic events, ticket booking, QR-based ticket lookup, user profile management, and admin analytics. The backend exposes REST and WebSocket APIs, while the frontend provides the customer booking flow and the admin event management dashboard.

# Main Features

- Public event discovery with search, trending events, spotlight events, and event detail pages
- User authentication with OTP email verification and JWT stored in an httpOnly cookie
- Real-time seat selection with WebSocket updates
- Temporary seat locking to prevent double booking
- Virtual queueing for high-traffic event booking
- End-to-end ticket booking flow with payment confirmation screen
- User profile, avatar upload, password change, and ticket history
- QR-based ticket display and ticket lookup
- Admin dashboard for event management, spotlight configuration, seat zones, and event status control
- Admin analytics for revenue trends, audience insights, ticket statistics, and low-ticket monitoring
- Demo users and demo events seeding for quick testing
- Docker Compose setup for frontend, backend, MySQL, and Redis

# Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Spring Boot, Java 21, Maven
- Database: MySQL
- Cache and queue state: Redis
- Realtime: WebSocket/STOMP
- Infrastructure: Docker Compose

# Demo Accounts

The application seeds these accounts automatically:

- Email: admin@ticketrush.com Password: admin123
- Email: user1@gmail.com - user200@gmail.com Password: 123456

# How to run

You **do not** need to install Java, Maven, or MySQL on your local machine. You only need to have **Docker** and Docker Compose installed.

## Step 1: Clone the repository

`git clone https://github.com/manhdua1/TicketRush-Backend.git`

## Step 2: Start the system

Open your terminal at the root directory of the project and run:

`docker compose up -d --build`

## Step 3: Verify the startup

To view the backend logs and ensure the application has started successfully:

`docker compose logs -f backend`

Once you see the message Started TicketrushBackendApplication, the system is ready!

- Database (MySQL) is running on port: 3306
- Backend API is running on port: 8080
- Redis is running on port: 6379

To stop the system:

`docker compose down`

# Project Structure

```txt
.
|-- docker-compose.yml       # Runs backend, frontend, MySQL, and Redis
|-- Dockerfile               # Backend production image
|-- pom.xml                  # Spring Boot dependencies and build config
|-- src/                     # Backend source code
|   `-- main/java/com/ticketrush/backend/
|       |-- config           # Security, CORS, Redis, WebSocket, Cloudinary
|       |-- controller       # REST controllers
|       |-- dto              # Request/response DTOs
|       |-- entity           # JPA entities
|       |-- exception        # Error handling
|       |-- init             # Demo data seeders
|       |-- mapper           # MapStruct mappers
|       |-- repository       # Spring Data repositories
|       |-- scheduler        # Booking/event background jobs
|       |-- security         # JWT service
|       |-- service          # Business logic
|       `-- util             # Shared utilities
`-- frontend/                # Next.js frontend application
    |-- app                  # App Router pages, layouts, and providers
    |-- components           # Shared UI components
    |-- features             # Feature modules for auth, events, booking, queue, user, admin, websocket
    |-- lib                  # Shared frontend configuration
    |-- public               # Static assets
    |-- next.config.ts       # Next.js configuration
    |-- package.json         # Frontend dependencies and scripts
    `-- tsconfig.json        # TypeScript configuration
```

# API Documentation

Swagger UI: http://localhost:8080/swagger-ui.html

# Requirement

https://drive.google.com/file/d/1OEZBD5f_eg3mrWTQSNm7Rhdu5Xlsh9vQ/view?usp=sharing
