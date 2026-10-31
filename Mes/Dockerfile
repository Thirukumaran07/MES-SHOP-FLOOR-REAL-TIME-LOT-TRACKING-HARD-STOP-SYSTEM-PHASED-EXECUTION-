# ==============================================================================
# Multi-Stage Dockerfile for Spring Boot MES Backend
# ==============================================================================

# Stage 1: Build stage with OpenJDK 25 & Maven
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Cache dependency layer
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

# Copy source and build
COPY src src
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal, secure JRE runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add unprivileged user for secure container operation
RUN addgroup -S mesgroup && adduser -S mesuser -G mesgroup

# Copy compiled JAR from builder
COPY --from=builder /app/target/*.jar app.jar
RUN chown -R mesuser:mesgroup /app

USER mesuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/orders || exit 1

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
