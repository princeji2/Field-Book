# Multi-stage build for certificate-service (Spring Boot + Maven).
#
# Render has no native Java runtime, so Docker is the standard path for a
# Spring Boot service there. This Dockerfile is also usable on Railway,
# Fly.io, or any other Docker-based host.
#
# Build stage compiles with a full JDK; the runtime stage uses only a JRE
# on Alpine for a minimal final image. Both stages pin Java 17 to match
# <java.version>17</java.version> in pom.xml.

# ── Build stage ──────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Copy the POM first so dependency resolution is cached across builds that
# only change source files, not dependencies.
COPY pom.xml .
RUN mvn -B dependency:go-offline -DskipTests || true

# Copy source and build the fat jar
COPY src ./src
RUN mvn -B -DskipTests package && \
    mv target/certificate-service-*.jar target/app.jar

# ── Runtime stage ────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the built jar from the build stage
# Copy the built jar from the build stage (renamed in build stage for stability)
COPY --from=build /build/target/app.jar app.jar

# Switch to non-root user
USER appuser

# Render sets PORT at runtime (see application.properties: server.port=${PORT:8081}).
# EXPOSE is documentation only but 8081 matches the local-dev default.
EXPOSE 8081

# JVM tuning for container environments:
# - UseContainerSupport: respect cgroup memory limits
# - MaxRAMPercentage: use up to 75% of container memory for heap
# - Disable bytecode verification for faster startup (safe for production jars)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Xverify:none", \
  "-jar", "app.jar"]
