# ==============================================================================
# Multi-stage Dockerfile for ORS Backend (Spring Boot 3.4 / Java 21)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the Spring Boot Application
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Install dependencies needed for build tools
RUN apk add --no-cache bash

# Copy Maven wrapper and POM first to leverage Docker layer caching
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies (offline) so changes to code don't re-download libraries
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B || true

# Copy source code and build the executable JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests --batch-mode

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime Environment
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Install curl/wget for container health check
RUN apk add --no-cache curl wget tzdata

# Set Bangkok / Thailand timezone by default
ENV TZ=Asia/Bangkok
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Security: Run as a non-privileged system user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built JAR artifact from builder stage
COPY --from=builder /build/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser

# Expose Spring Boot HTTP port
EXPOSE 8080

# Configure JVM options for container memory limits
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Healthcheck endpoint (checks Spring Boot health API)
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

# Launch Spring Boot application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

