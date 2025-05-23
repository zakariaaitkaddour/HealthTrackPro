# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy only the POM file first (for layer caching)
COPY pom.xml .

# Download all dependencies (cached unless POM changes)
RUN mvn dependency:go-offline -B

# Copy the rest of the source code
COPY src ./src

# Build the application
RUN mvn package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the default Spring Boot port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]