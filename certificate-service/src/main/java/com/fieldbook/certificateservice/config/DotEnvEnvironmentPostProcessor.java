package com.fieldbook.certificateservice.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads a {@code .env.local} file (shell-style {@code KEY=value} pairs) into
 * the Spring {@link org.springframework.core.env.Environment} at startup, so
 * secrets can live in a git-ignored file on the developer's machine instead
 * of the shell.
 *
 * <p>Runs before configuration property binding, which means placeholders
 * like {@code ${SUPABASE_URL:}} in {@code application.properties} resolve
 * against these values.</p>
 *
 * <p>Search order:</p>
 * <ol>
 *   <li>Path from the {@code dotenv.path} JVM system property, if set.</li>
 *   <li>{@code ./.env.local} relative to the JVM working directory.</li>
 * </ol>
 *
 * <p>File format:</p>
 * <ul>
 *   <li>{@code KEY=value} — one per line.</li>
 *   <li>Values may be wrapped in single or double quotes; the quotes are stripped.</li>
 *   <li>Lines starting with {@code #} and blank lines are ignored.</li>
 *   <li>Malformed lines are skipped with a warning.</li>
 * </ul>
 *
 * <p>Precedence: values loaded here override OS environment variables of
 * the same name. That's the point of the file — it's the local override.
 * If you want the shell env to win, unset the key in {@code .env.local}.</p>
 */
public class DotEnvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "dotEnvLocal";
    private static final String DEFAULT_FILE_NAME = ".env.local";
    private static final String OVERRIDE_SYSTEM_PROPERTY = "dotenv.path";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path candidate = resolvePath();
        if (candidate == null || !Files.isRegularFile(candidate)) {
            return;
        }

        Map<String, Object> loaded;
        try {
            loaded = parse(Files.readAllLines(candidate, StandardCharsets.UTF_8));
        } catch (IOException e) {
            // stderr is used here because the Spring/Logback logging pipeline isn't
            // fully initialized at env-post-processor time; JUL messages emitted this
            // early are effectively invisible.
            System.err.println("[dotenv] Could not read " + candidate + ": " + e.getMessage());
            return;
        }

        if (loaded.isEmpty()) {
            return;
        }

        MapPropertySource source = new MapPropertySource(PROPERTY_SOURCE_NAME, loaded);
        // Insert BEFORE system environment so the file wins for local dev.
        environment.getPropertySources().addBefore(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, source);

        System.err.println("[dotenv] loaded " + loaded.size() + " entries from " + candidate.toAbsolutePath());
    }

    private Path resolvePath() {
        String override = System.getProperty(OVERRIDE_SYSTEM_PROPERTY);
        if (override != null && !override.isBlank()) {
            return Paths.get(override);
        }
        return Paths.get(System.getProperty("user.dir"), DEFAULT_FILE_NAME);
    }

    /**
     * Parses lines from a dotenv-style file. Package-private for tests.
     */
    static Map<String, Object> parse(List<String> lines) {
        Map<String, Object> result = new LinkedHashMap<>();
        int lineNo = 0;
        for (String rawLine : lines) {
            lineNo++;
            String line = rawLine.strip();
            if (line.isEmpty() || line.startsWith("#")) continue;

            // Allow "export KEY=value" for parity with common shell patterns.
            if (line.startsWith("export ")) {
                line = line.substring("export ".length()).stripLeading();
            }

            int eq = line.indexOf('=');
            if (eq <= 0) {
                System.err.println("[dotenv] ignoring malformed line " + lineNo + " (no '='): " + rawLine);
                continue;
            }

            String key = line.substring(0, eq).strip();
            String value = line.substring(eq + 1).strip();

            // Strip surrounding quotes.
            if (value.length() >= 2) {
                char first = value.charAt(0);
                char last = value.charAt(value.length() - 1);
                if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                    value = value.substring(1, value.length() - 1);
                }
            }

            if (key.isEmpty()) {
                System.err.println("[dotenv] ignoring line " + lineNo + " (empty key): " + rawLine);
                continue;
            }

            result.put(key, value);
        }
        return result;
    }

    @Override
    public int getOrder() {
        // Run late enough that Spring's own default property sources are already there,
        // but early enough that our source is visible to configuration binding.
        return Ordered.LOWEST_PRECEDENCE - 10;
    }
}
