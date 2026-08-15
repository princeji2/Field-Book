# Certificate Service

A standalone Spring Boot service that generates certificate PDFs for Field Book. It is
independent of the Vite/React app in `/src` at the project root — separate build, separate
lifecycle, separate deployment.

## Stack

- Java 17+ (tested with Java 26)
- Spring Boot 4.1.0 (`spring-boot-starter-web`, `spring-boot-starter-validation`)
- Apache PDFBox 3.0.8 for PDF generation
- Maven

## What it does

`POST /api/certificates/generate` reads a template row from Supabase, downloads the
template's background image, stamps the student name, event title, and certificate code onto
it at the positions defined by the template's `fields` JSON, uploads the finished PDF to the
`certificates` bucket in Supabase Storage, and returns the public URL.

The `fields` JSON is expected to match the shape produced by the frontend template editor
(`src/app/admin/templates.tsx`): an array of
`{ id, enabled, fontFamily, size, x, y }` entries, where `x` and `y` are percentages (0–100)
of the certificate canvas, center-anchored. The service stamps values into these well-known
field ids:

| Field id  | Value stamped     |
|-----------|-------------------|
| `f-name`  | `studentName`     |
| `f-event` | `eventTitle`      |
| `f-id`    | `certificateCode` |

Any other field ids in the template's `fields` JSON are ignored — organizer signature lines,
dates, custom fields, and so on are treated as part of the background design.

## Configuration

All Supabase credentials are read from configuration, never hardcoded. Two sources are
supported and the first one that has a value wins:

1. **`certificate-service/.env.local`** — a git-ignored file next to `pom.xml`. Preferred
   for local development. Shell-style `KEY=value` lines; see `.env.local.example` for the
   exact shape. Values here override OS environment variables of the same name.
2. **OS environment variables** — used in CI and production.

| Key                             | Required | Description                                                                 |
|---------------------------------|----------|-----------------------------------------------------------------------------|
| `SUPABASE_URL`                  | Yes      | Base URL of your Supabase project, e.g. `https://xyzcompany.supabase.co`.   |
| `SUPABASE_SERVICE_KEY`          | Yes      | Service-role key for the project. Bypasses RLS — server-side use only.       |
| `SUPABASE_CERTIFICATES_BUCKET`  | No       | Storage bucket name for generated PDFs. Defaults to `certificates`.          |
| `SUPABASE_TEMPLATES_TABLE`      | No       | Table name for templates. Defaults to `certificate_templates`.               |

The `certificates` bucket must exist and be **public** for the returned URLs to be
directly accessible. Create it in the Supabase dashboard (Storage → New bucket → mark as
public) or via SQL/CLI.

### Using `.env.local`

1. From this directory, copy the template: `Copy-Item .env.local.example .env.local` (or
   `cp .env.local.example .env.local`).
2. Open `.env.local` and paste your real `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
3. Start the service — it will log
   `Loaded N entries from .../certificate-service/.env.local` at startup.

Because the file is `.gitignored`, it stays on your machine only. Do not paste service-role
keys into chat, tickets, or PR descriptions.

### Overriding the file location

Set the JVM system property `dotenv.path` to point at a specific file, e.g.
`java -Ddotenv.path=/secure/place/.env -jar target/certificate-service-0.1.0.jar`.

## Running locally

### Prerequisites

- JDK 17 or newer (tested with 26).
- Maven 3.9+.
- A Supabase project with the `certificate_templates` table populated and the
  `certificates` Storage bucket created.

### Start the service

With `.env.local` populated (recommended for local dev):

```powershell
mvn spring-boot:run
```

Or, if you prefer shell environment variables:

```powershell
$env:SUPABASE_URL = "https://<your-project>.supabase.co"
$env:SUPABASE_SERVICE_KEY = "<service-role-key>"
mvn spring-boot:run
```

```bash
export SUPABASE_URL="https://<your-project>.supabase.co"
export SUPABASE_SERVICE_KEY="<service-role-key>"
mvn spring-boot:run
```

The service listens on port `8081` by default. Stop it with `Ctrl+C`.

### Build a jar

```powershell
mvn clean package
```

Produces `target/certificate-service-0.1.0.jar`, runnable with `java -jar`.

### Run tests

```powershell
mvn test
```

The bundled context-load test does not require live Supabase credentials — the properties
default to empty strings, and only the actual endpoint call fails fast if they aren't set.

## API

### `POST /api/certificates/generate`

**Request:**

```json
{
  "studentName": "Jane Doe",
  "eventTitle": "Spring Bootcamp 2026",
  "templateId": "tpl-001",
  "certificateCode": "CERT-ABC123"
}
```

All fields required and non-blank.

**Response (200):**

```json
{
  "certificateUrl": "https://<project>.supabase.co/storage/v1/object/public/certificates/CERT-ABC123.pdf"
}
```

**Error responses:**

| Status | When                                                         | Body shape                                              |
|--------|--------------------------------------------------------------|---------------------------------------------------------|
| 400    | Missing or blank required field in the request               | `{ "error": "Validation failed", "fields": { ... } }`   |
| 404    | `templateId` doesn't exist in `certificate_templates`        | `{ "error": "Template not found", "message": "..." }`   |
| 422    | Template row exists but has no `background_image_url`        | `{ "error": "Certificate cannot be generated", ... }`   |
| 502    | Supabase reachable but returned an error, or upload failed   | `{ "error": "Supabase integration failure", ... }`      |

### Example (curl)

```bash
curl -X POST http://localhost:8081/api/certificates/generate \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Jane Doe","eventTitle":"Spring Bootcamp 2026","templateId":"tpl-001","certificateCode":"CERT-ABC123"}'
```

## Project structure

```
certificate-service/
  pom.xml
  src/
    main/
      java/com/fieldbook/certificateservice/
        CertificateServiceApplication.java     # Spring Boot entry point
        config/
          SupabaseProperties.java              # env-backed config props
          SupabaseConfig.java                  # RestClient bean + @EnableConfigurationProperties
        controller/
          CertificateController.java           # POST /api/certificates/generate
          ValidationExceptionHandler.java      # 400 / 404 / 422 / 502 handlers
        dto/
          CertificateRequest.java              # request payload
          CertificateResponse.java             # { certificateUrl }
        exception/
          TemplateNotFoundException.java       # → 404
          SupabaseIntegrationException.java    # → 502
        model/
          CertificateTemplate.java             # certificate_templates row
          TemplateField.java                   # one entry in the fields JSON
        service/
          CertificateTemplateService.java      # template fetch via SupabaseClient
          CertificatePdfService.java           # PDFBox rendering onto template background
          CertificateStorageService.java       # upload to certificates bucket
        supabase/
          SupabaseClient.java                  # PostgREST + Storage HTTP client
      resources/
        application.properties
    test/
      java/com/fieldbook/certificateservice/
        CertificateServiceApplicationTests.java
```

## Notes and follow-ups

- **Auth on this endpoint.** The endpoint is unauthenticated. Before it's reachable outside
  local dev, add an access control layer (an API key or service-to-service token) — the
  service-role Supabase key gives this process full DB access, so any caller who can reach
  this endpoint can effectively read/write any template.
- **Bucket policies.** Only the `certificates` bucket needs to be public; the
  `certificate-templates` bucket that stores backgrounds can remain private if the service
  key has read access to it (which it does by default).
- **Fonts.** The service uses the PDFBox Standard-14 fonts (Times, Helvetica, Courier),
  mapped from the template's `fontFamily` value. If you need the exact serif and mono faces
  the frontend uses (Fraunces, IBM Plex Mono), embed those fonts and switch
  `CertificatePdfService.resolveFont` to load them from `PDType0Font.load(...)`.
- **Font sizes.** The `size` categories (`xl`/`lg`/`md`/`sm`) are matched to the frontend
  editor's canvas at 560px wide, then scaled proportionally to the actual PDF width. If
  templates look off after real-world testing, tweak `FRONTEND_FONT_SIZES` in
  `CertificatePdfService` or the `BASE_PAGE_WIDTH`.
