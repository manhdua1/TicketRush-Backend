# Overview

TicketRush is a full-stack, Dockerized high-concurrency event ticketing platform built with Spring Boot, Next.js, MySQL, and Redis for INT3306 - Web Application Development @ VNU-UET.

The system supports event discovery, real-time seat selection, temporary seat locking, virtual queueing for high-traffic events, ticket booking, QR-based ticket lookup, user profile management, and admin analytics. The backend exposes REST and WebSocket APIs, while the frontend provides the customer booking flow and the admin event management dashboard.

# Main Features

- Authentication with OTP email verification
- JWT authentication stored in an httpOnly cookie
- Event listing, search, spotlight, trending, and admin event management
- Zone and seat management
- Seat locking and booking confirmation
- Virtual queue for high-traffic events
- Ticket lookup by QR code
- Realtime seat updates via WebSocket
- Admin revenue, audience, and ticket statistics
- Demo users and demo events seeding

# Tech Stack
* Build tool: Maven >= 3.9.5
* Java: 21
* Framework: Spring Boot 4.0.5

# Demo Accounts
The application seeds these accounts automatically:
- Email: admin@ticketrush.com Password: admin123
- Email: user1@gmail.com - user200@gmail.com Password: 123456

# Frontend Github Repo:
https://github.com/HieuPD123/TicketRush-Frontend

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

* Database (MySQL) is running on port: 3306
* Backend API is running on port: 8080

To stop the system:

`docker compose down`

# Project Structure

```txt
src/main/java/com/ticketrush/backend
├── config        # Security, CORS, Redis, WebSocket, Cloudinary
├── controller    # REST controllers
├── dto           # Request/response DTOs
├── entity        # JPA entities
├── exception     # Error handling
├── init          # Demo data seeders
├── mapper        # MapStruct mappers
├── repository    # Spring Data repositories
├── scheduler     # Booking/event background jobs
├── security      # JWT service
├── service       # Business logic
└── util          # Shared utilities
```

# API Documentation
Swagger UI: http://localhost:8080/swagger-ui.html

# Requirement
https://drive.google.com/file/d/1OEZBD5f_eg3mrWTQSNm7Rhdu5Xlsh9vQ/view?usp=sharing
