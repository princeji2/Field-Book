# Multi-stage build for certificate-service (Spring Boot + Maven).
#
# Render has no native Java runtime (Node/Bun, Python, Ruby, Go, Rust, and
# Elixir only — see https://render.com/docs/native-runtimes), so Docker is
# the standard path for a Spring Boot service there. This Dockerfile is
# also usable on Railway, Fly.io, or any other Docker-based host.
#
# Build stage compiles with a full JDK; the runtime stage only needs a JRE,
# keeping the final image smaller. Both stages pin Java 17 to match
# <java.version>17</java.version> in pom.xml.

# ── Build stage ──────────────────────────────────────────────────────────
# maven:3.9-eclipse-temurin-17 bundles both Maven and JDK 17 — plain
# eclipse-temurin images don't include Maven, only a JDK/JRE.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Copy the POM first so dependency resolution is cached across builds that
# only change source files, not dependencies.
COPY pom.xml .
RUN mvn -B -f pom.xml dependency:go-offline || true

COPY src ./src
RUN mvn -B -DskipTests package

# ── Runtime stage ────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /build/target/certificate-service-0.1.0.jar app.jar

# Render sets PORT at runtime (see application.properties: server.port=${PORT:8081}).
# EXPOSE is documentation only — it doesn't bind anything itself — but 8081
# matches the local-dev default for anyone running this image directly.
EXPOSE 8081

# No .env.local inside the container — SUPABASE_URL / SUPABASE_SERVICE_KEY
# must be supplied as real environment variables by the host platform
# (Render env vars, Railway variables, etc.). DotEnvEnvironmentPostProcessor
# only loads a file that isn't present in this image, so it's a no-op here.
ENTRYPOINT ["java", "-jar", "app.jar"]
