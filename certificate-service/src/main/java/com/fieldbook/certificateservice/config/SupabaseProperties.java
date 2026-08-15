package com.fieldbook.certificateservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Supabase connection settings, sourced from environment variables via
 * placeholders in application.properties.
 *
 * <p>URL and service key must be provided at runtime. Empty defaults keep
 * the Spring context loadable for tests (see application.properties), but
 * calls that actually need Supabase will fail-fast with a clear message if
 * the values are missing.</p>
 */
@ConfigurationProperties(prefix = "supabase")
public class SupabaseProperties {

    /**
     * Base URL of the Supabase project, e.g. https://xyzcompany.supabase.co.
     * Injected from the SUPABASE_URL environment variable.
     */
    private String url = "";

    /**
     * Supabase service-role key. Bypasses RLS and must never be exposed to
     * clients. Injected from the SUPABASE_SERVICE_KEY environment variable.
     */
    private String serviceKey = "";

    /**
     * Name of the Storage bucket where generated certificates are uploaded.
     * Defaults to "certificates". The bucket must exist and be public.
     */
    private String certificatesBucket = "certificates";

    /**
     * Name of the certificate_templates table in the Supabase schema.
     */
    private String templatesTable = "certificate_templates";

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url == null ? "" : url.trim().replaceAll("/+$", "");
    }

    public String getServiceKey() {
        return serviceKey;
    }

    public void setServiceKey(String serviceKey) {
        this.serviceKey = serviceKey == null ? "" : serviceKey;
    }

    public String getCertificatesBucket() {
        return certificatesBucket;
    }

    public void setCertificatesBucket(String certificatesBucket) {
        this.certificatesBucket = certificatesBucket;
    }

    public String getTemplatesTable() {
        return templatesTable;
    }

    public void setTemplatesTable(String templatesTable) {
        this.templatesTable = templatesTable;
    }

    public boolean isConfigured() {
        return !url.isBlank() && !serviceKey.isBlank();
    }
}
