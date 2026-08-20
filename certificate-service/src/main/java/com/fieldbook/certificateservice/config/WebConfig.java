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
 *
 * <p>Vercel preview URLs are also supported via origin patterns so that
 * PR preview deployments can reach this service without updating env vars
 * every time.</p>
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String LOCAL_DEV_ORIGIN = "http://localhost:5173";

    /**
     * Comma-separated list of additional allowed origins, e.g.
     * {@code https://field-book.vercel.app} or
     * {@code https://field-book.vercel.app,https://orgs.social}.
     * Empty by default — only local dev is allowed until this is set.
     */
    @Value("${cors.frontend-origin:}")
    private String frontendOriginProperty;

    /**
     * Comma-separated origin patterns that support wildcards in subdomains,
     * e.g. {@code https://*.vercel.app}. This allows Vercel preview
     * deployments (field-book-*.vercel.app) to reach the service without
     * adding each preview URL manually.
     */
    @Value("${cors.frontend-origin-pattern:}")
    private String frontendOriginPatternProperty;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        var mapping = registry.addMapping("/api/**")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization")
                .allowCredentials(false)
                .maxAge(3600);

        // Also allow the actuator health endpoint for monitoring tools
        registry.addMapping("/actuator/**")
                .allowedOrigins("*")
                .allowedMethods("GET")
                .maxAge(3600);

        String[] origins = allowedOrigins();
        String[] patterns = allowedOriginPatterns();

        // Spring MVC requires either allowedOrigins OR allowedOriginPatterns,
        // not both on the same mapping. If we have patterns, use patterns and
        // add all fixed origins as literal patterns too.
        if (patterns.length > 0) {
            List<String> allPatterns = new ArrayList<>(List.of(patterns));
            for (String o : origins) {
                allPatterns.add(o); // exact origins work as patterns too
            }
            mapping.allowedOriginPatterns(allPatterns.toArray(new String[0]));
        } else {
            mapping.allowedOrigins(origins);
        }
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

    private String[] allowedOriginPatterns() {
        List<String> patterns = new ArrayList<>();

        if (StringUtils.hasText(frontendOriginPatternProperty)) {
            for (String pattern : frontendOriginPatternProperty.split(",")) {
                String trimmed = pattern.trim();
                if (!trimmed.isEmpty()) {
                    patterns.add(trimmed);
                }
            }
        }

        return patterns.toArray(new String[0]);
    }
}
