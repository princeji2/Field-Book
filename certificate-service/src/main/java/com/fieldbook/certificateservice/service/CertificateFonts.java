package com.fieldbook.certificateservice.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;

import java.io.IOException;
import java.io.InputStream;
import java.util.EnumMap;
import java.util.Map;

/**
 * Loads the three Fieldbook design-system typefaces as embedded,
 * subsettable {@link PDType0Font}s, matching the role assignments in the
 * design-system steering doc:
 *
 * <ul>
 *   <li>{@link Role#SERIF} — Fraunces (student name, event title, headline text)</li>
 *   <li>{@link Role#SANS} — Public Sans (body/UI text)</li>
 *   <li>{@link Role#MONO} — IBM Plex Mono (certificate codes, ids, timestamps)</li>
 * </ul>
 *
 * <p>Font files live in {@code src/main/resources/fonts/} and are static
 * SemiBold/Medium weights pulled from Google Fonts' Fraunces, Public Sans,
 * and IBM Plex Mono families — all released under the SIL Open Font
 * License 1.1, which explicitly permits embedding font software in
 * documents and software (see {@code fonts/OFL.txt} alongside them, and
 * {@code ATTRIBUTIONS.md} at the project root). No substitute font is
 * needed: Fraunces itself is freely embeddable.</p>
 *
 * <p>{@link PDType0Font} instances are bound to the {@link PDDocument} they
 * were loaded into and can't be reused across documents, so a fresh
 * {@link CertificateFonts} must be created per PDF being rendered.</p>
 */
public final class CertificateFonts {

    public enum Role { SERIF, SANS, MONO }

    private static final Map<Role, String> RESOURCE_PATHS = Map.of(
            Role.SERIF, "/fonts/Fraunces-SemiBold.ttf",
            Role.SANS, "/fonts/PublicSans-SemiBold.ttf",
            Role.MONO, "/fonts/IBMPlexMono-SemiBold.ttf"
    );

    /** A slightly lighter mono weight, used for small caption-style mono text (e.g. the seal's arc text). */
    private static final String MONO_MEDIUM_PATH = "/fonts/IBMPlexMono-Medium.ttf";

    private final Map<Role, PDFont> loaded = new EnumMap<>(Role.class);
    private final PDDocument document;
    private PDFont monoMedium;

    public CertificateFonts(PDDocument document) {
        this.document = document;
    }

    /** Returns the embedded font for the given design-system role, loading and caching it on first use. */
    public PDFont get(Role role) throws IOException {
        PDFont cached = loaded.get(role);
        if (cached != null) return cached;

        PDFont font = load(RESOURCE_PATHS.get(role));
        loaded.put(role, font);
        return font;
    }

    /** The lighter-weight mono face used for small labels like the seal's arc text. */
    public PDFont getMonoMedium() throws IOException {
        if (monoMedium != null) return monoMedium;
        monoMedium = load(MONO_MEDIUM_PATH);
        return monoMedium;
    }

    /** Maps the frontend's {@code fontFamily} field value ({@code serif}/{@code sans}/{@code mono}) to a Role. */
    public static Role roleFor(String frontendFontFamily) {
        String f = frontendFontFamily == null ? "serif" : frontendFontFamily.toLowerCase();
        return switch (f) {
            case "mono" -> Role.MONO;
            case "sans" -> Role.SANS;
            default -> Role.SERIF;
        };
    }

    private PDFont load(String resourcePath) throws IOException {
        try (InputStream in = CertificateFonts.class.getResourceAsStream(resourcePath)) {
            if (in == null) {
                throw new IOException("Embedded font resource not found on classpath: " + resourcePath);
            }
            // embedSubset=true: only the glyphs actually used get embedded, keeping the PDF small.
            return PDType0Font.load(document, in, true);
        }
    }
}
