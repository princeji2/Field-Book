package com.fieldbook.certificateservice.supabase;

import com.fieldbook.certificateservice.config.SupabaseProperties;
import com.fieldbook.certificateservice.exception.SupabaseIntegrationException;
import com.fieldbook.certificateservice.exception.TemplateNotFoundException;
import com.fieldbook.certificateservice.model.CertificateTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Thin wrapper around the Supabase PostgREST and Storage HTTP APIs. Only
 * exposes the calls this service needs: fetch a certificate template by id,
 * download the background image, and upload the finished PDF.
 *
 * <p>All requests are authenticated with the service-role key. This key
 * bypasses RLS, so this client MUST only ever be used server-side.</p>
 */
@Component
public class SupabaseClient {

    private final SupabaseProperties props;
    private final RestClient restClient;
    private final HttpClient httpClient;

    public SupabaseClient(SupabaseProperties props, RestClient restClient) {
        this.props = props;
        this.restClient = restClient;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Fetches a single row from {@code certificate_templates} by id.
     *
     * @throws TemplateNotFoundException     if no row matches
     * @throws SupabaseIntegrationException  on any other failure
     */
    public CertificateTemplate fetchTemplate(String templateId) {
        requireConfigured();

        String url = props.getUrl()
                + "/rest/v1/"
                + props.getTemplatesTable()
                + "?id=eq." + URLEncoder.encode(templateId, StandardCharsets.UTF_8)
                + "&select=id,background_image_url,aspect_ratio,fields"
                + "&limit=1";

        List<CertificateTemplate> rows;
        try {
            rows = restClient.get()
                    .uri(url)
                    .header("apikey", props.getServiceKey())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + props.getServiceKey())
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new SupabaseIntegrationException(
                                "PostgREST returned " + res.getStatusCode() + " when fetching template "
                                        + templateId + ": " + readBody(res.getBody()));
                    })
                    .body(new ParameterizedTypeReference<List<CertificateTemplate>>() {});
        } catch (SupabaseIntegrationException e) {
            throw e;
        } catch (RestClientException e) {
            throw new SupabaseIntegrationException(
                    "Failed to reach Supabase PostgREST for template " + templateId, e);
        }

        if (rows == null || rows.isEmpty()) {
            throw new TemplateNotFoundException(templateId);
        }
        return rows.get(0);
    }

    /**
     * Downloads an image (or any binary asset) from an arbitrary HTTPS URL.
     * The URL is expected to be a Supabase Storage public URL from the
     * {@code background_image_url} column, but any reachable URL works.
     */
    public byte[] downloadBytes(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() / 100 != 2) {
                throw new SupabaseIntegrationException(
                        "Failed to download background image from " + url
                                + " (status " + response.statusCode() + ")");
            }
            return response.body();
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new SupabaseIntegrationException("Error downloading " + url, e);
        }
    }

    /**
     * Uploads bytes to a Supabase Storage bucket at the given object path
     * and returns the public URL for that object.
     *
     * <p>Uses {@code x-upsert: true} so a repeat call for the same
     * certificate code overwrites cleanly rather than 409-ing.</p>
     */
    public String uploadToBucket(String bucket, String objectPath, byte[] body, String contentType) {
        requireConfigured();

        String encodedPath = encodePath(objectPath);
        String url = props.getUrl() + "/storage/v1/object/" + bucket + "/" + encodedPath;

        try {
            restClient.post()
                    .uri(url)
                    .header("apikey", props.getServiceKey())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + props.getServiceKey())
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header("x-upsert", "true")
                    .body(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new SupabaseIntegrationException(
                                "Storage upload to " + bucket + "/" + objectPath
                                        + " failed with " + res.getStatusCode() + ": "
                                        + readBody(res.getBody()));
                    })
                    .toBodilessEntity();
        } catch (SupabaseIntegrationException e) {
            throw e;
        } catch (RestClientException e) {
            throw new SupabaseIntegrationException(
                    "Failed to reach Supabase Storage for upload " + bucket + "/" + objectPath, e);
        }

        return props.getUrl() + "/storage/v1/object/public/" + bucket + "/" + encodedPath;
    }

    /**
     * Inserts one row into {@code public.certificates} right after a
     * generated PDF has been uploaded to Storage. Called with the
     * service-role key, so this bypasses RLS by design — it is the sole
     * write path for issuing a certificate row (see
     * {@code certificates_insert_admin} in the RLS migration; students have
     * no client-side insert policy on this table, and this call happens
     * server-side instead of from the browser).
     *
     * @param eventId          nullable — {@code certificates.event_id} allows null
     * @param studentId        nullable — {@code certificates.student_id} allows null
     * @param templateId       nullable — {@code certificates.template_id} allows null
     * @param certificateCode  required, unique per row
     * @param certificateUrl   the public Storage URL just uploaded to
     * @throws SupabaseIntegrationException on any non-2xx response or network failure
     */
    public void insertCertificateRecord(String eventId, String studentId, String templateId,
                                        String certificateCode, String certificateUrl) {
        requireConfigured();

        String url = props.getUrl() + "/rest/v1/certificates";

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("event_id", blankToNull(eventId));
        row.put("student_id", blankToNull(studentId));
        row.put("template_id", blankToNull(templateId));
        row.put("certificate_code", certificateCode);
        row.put("certificate_url", certificateUrl);

        try {
            restClient.post()
                    .uri(url)
                    .header("apikey", props.getServiceKey())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + props.getServiceKey())
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    // Minimal return avoids pulling the row back over the wire —
                    // the caller already has everything it needs (certificateUrl).
                    .header("Prefer", "return=minimal")
                    .body(row)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new SupabaseIntegrationException(
                                "PostgREST returned " + res.getStatusCode()
                                        + " when inserting certificate row for code "
                                        + certificateCode + ": " + readBody(res.getBody()));
                    })
                    .toBodilessEntity();
        } catch (SupabaseIntegrationException e) {
            throw e;
        } catch (RestClientException e) {
            throw new SupabaseIntegrationException(
                    "Failed to reach Supabase PostgREST to insert certificate row for code "
                            + certificateCode, e);
        }
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private void requireConfigured() {
        if (!props.isConfigured()) {
            throw new SupabaseIntegrationException(
                    "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY "
                            + "environment variables before calling this service.");
        }
    }

    private static String encodePath(String path) {
        // Encode each segment individually so that "/" separators are preserved.
        String[] parts = path.split("/");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append('/');
            sb.append(URLEncoder.encode(parts[i], StandardCharsets.UTF_8).replace("+", "%20"));
        }
        return sb.toString();
    }

    private static String readBody(InputStream in) {
        if (in == null) return "<empty>";
        try {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "<unreadable: " + e.getMessage() + ">";
        }
    }
}
