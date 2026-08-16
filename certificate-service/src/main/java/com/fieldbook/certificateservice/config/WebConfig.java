package com.fieldbook.certificateservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

/**
 * CORS configuration for the certificate-service API.
 *
 * <p>Allowed origins are an explicit allow-list — never a wildcard. This
 * service accepts requests carrying no authentication of its own today
 * (see the "Auth on this endpoint" note in README.md), so a wildcard
 * {@code allowedOrigins("*")} would let any origin in a user's browser
 * call {@code /api/certificates/generate} unattributed. Locking this to
 * known frontend origins is a minimal guardrail, not a substitute for
 * adding real request auth before this is reachable outside local dev.</p>
 *
 * <p>{@code http://localhost:5173} (the Vite dev server default) is always
 * allowed, so local frontend development keeps working regardless of what
 * else is configured. A deployed frontend origin — e.g. a Vercel/Netlify
 * URL or custom domain — is added via the {@code FRONTEND_ORIGIN}
 * environment variable once that URL is known; unset, only localhost is
 * allowed. Supports a comma-separated list if the frontend ends up served
 * from more than one origin (e.g. a preview URL alongside the production
 * domain).</p>
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String LOCAL_DEV_ORIGIN = "http://localhost:5173";

    /**
     * Comma-separated list of additional allowed origins, e.g.
     * {@code https://fieldbook.example.com} or
     * {@code https://fieldbook.example.com,https://preview.fieldbook.example.com}.
     * Empty by default — only local dev is allowed until this is set.
     */
    @Value("${cors.frontend-origin:}")
    private String frontendOriginProperty;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins())
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type")
                .allowCredentials(false)
                .maxAge(3600);
    }

    private String[] allowedOrigins() {
        List<String> origins = new ArrayList<>();
        origins.add(LOCAL_DEV_ORIGIN);

        if (StringUtils.hasText(frontendOriginProperty)) {
            for (String origin : frontendOriginProperty.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty()) {
                    origins.add(trimmed);
                }
            }
        }

        return origins.toArray(new String[0]);
    }
}
