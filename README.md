# Tech Stack
* Build tool: Maven >= 3.9.5
* Java: 21
* Framework: Spring Boot 4.0.5

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

## API Documentation
Swagger UI: http://localhost:8080/swagger-ui.html