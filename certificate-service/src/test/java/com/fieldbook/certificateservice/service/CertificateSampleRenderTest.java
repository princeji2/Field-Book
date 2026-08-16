package com.fieldbook.certificateservice.service;

import com.fieldbook.certificateservice.model.CertificateTemplate;
import com.fieldbook.certificateservice.model.TemplateField;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Not a behavioral unit test in the strict sense — this generates a visual
 * sample certificate PDF (and a PNG rendition of it) under {@code target/}
 * so the Seal geometry, embedded fonts, and design-system colors can be
 * eyeballed against the in-app certificate preview. Re-run with
 * {@code mvn test -Dtest=CertificateSampleRenderTest} whenever
 * {@link CertificateSealRenderer} or font embedding changes.
 *
 * <p>The background image drawn here is a stand-in for a real uploaded
 * template background (which the actual service never generates — that's
 * the organizer's job in the template editor). It approximates the
 * "Certificate card pattern" from the design-system doc using the same
 * color tokens, purely so the rendered sample looks like a certificate
 * instead of text floating on a blank page.</p>
 */
class CertificateSampleRenderTest {

    private static final Color PAPER = new Color(0xF6, 0xF1, 0xE7);
    private static final Color INK = new Color(0x1E, 0x1B, 0x16);
    private static final Color MUTED = new Color(0x6B, 0x63, 0x55);
    private static final Color DIVIDER = new Color(0xDC, 0xD4, 0xC2);
    private static final Color MARIGOLD = new Color(0xE2, 0xA2, 0x3B);

    @Test
    void generatesSampleCertificateForVisualReview() throws IOException {
        int pxW = 1684, pxH = 1190; // 2x an A4-landscape-ish canvas, for a crisp PNG preview

        CertificateTemplate template = new CertificateTemplate();
        template.setAspectRatio((double) pxW / pxH);
        template.setFields(List.of(
                field("f-name", "serif", "xl", 50, 32),
                field("f-event", "serif", "lg", 50, 48),
                field("f-id", "mono", "sm", 75, 80)
        ));

        byte[] background = renderBackground(pxW, pxH);

        CertificatePdfService service = new CertificatePdfService();
        byte[] pdfBytes = service.render(
                template, background,
                "Alexandra Okonkwo",
                "Environmental Policy Symposium",
                "CERT-FB-2024-088021"
        );

        assertTrue(pdfBytes.length > 0, "rendered PDF should not be empty");

        Path outDir = Path.of("target", "sample-output");
        Files.createDirectories(outDir);
        Path pdfPath = outDir.resolve("sample-certificate.pdf");
        Files.write(pdfPath, pdfBytes);

        Path pngPath = outDir.resolve("sample-certificate.png");
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            PDFRenderer renderer = new PDFRenderer(doc);
            BufferedImage image = renderer.renderImageWithDPI(0, 200, ImageType.RGB);
            ImageIO.write(image, "png", pngPath.toFile());
        }

        assertTrue(Files.exists(pngPath), "PNG preview should have been written");
        System.out.println("Sample certificate written to: " + pdfPath.toAbsolutePath());
        System.out.println("PNG preview written to: " + pngPath.toAbsolutePath());

        assertFontsAreEmbedded(pdfBytes);
    }

    /**
     * Confirms the Fraunces / IBM Plex Mono glyphs actually got embedded as
     * subsetted Type0 fonts rather than silently falling back to a
     * Standard-14 font (which would defeat the point of embedding them).
     */
    private static void assertFontsAreEmbedded(byte[] pdfBytes) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            PDPage page = doc.getPage(0);
            PDResources resources = page.getResources();
            boolean sawEmbeddedFont = false;
            for (COSName name : resources.getFontNames()) {
                PDFont font = resources.getFont(name);
                System.out.println("Font resource " + name.getName() + " -> " + font.getName()
                        + " (embedded=" + font.isEmbedded() + ")");
                assertTrue(font.isEmbedded(), "Font " + font.getName() + " should be embedded, not a Standard-14 fallback");
                sawEmbeddedFont = true;
            }
            assertTrue(sawEmbeddedFont, "Expected at least one font resource on the page (student name / event / id / seal text)");
        }
    }

    private static TemplateField field(String id, String fontFamily, String size, double x, double y) {
        TemplateField f = new TemplateField();
        f.setId(id);
        f.setEnabled(true);
        f.setFontFamily(fontFamily);
        f.setSize(size);
        f.setX(x);
        f.setY(y);
        return f;
    }

    /** Draws a stand-in certificate-card background using the frozen design-system tokens. */
    private static byte[] renderBackground(int w, int h) throws IOException {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        float s = w / 560f; // scale factor from the frontend's 560px editor canvas

        // Paper background.
        g.setColor(PAPER);
        g.fillRect(0, 0, w, h);

        // Marigold top stripe.
        g.setColor(MARIGOLD);
        g.fillRect(0, 0, w, Math.round(6 * s));

        int pad = Math.round(48 * s);

        // Header row: wordmark (left) + eyebrow label (right).
        g.setColor(INK);
        g.setFont(new Font("Georgia", Font.BOLD, Math.round(20 * s)));
        g.drawString("Fieldbook", pad, Math.round(58 * s));

        g.setColor(MUTED);
        g.setFont(new Font("Courier New", Font.PLAIN, Math.round(11 * s)));
        String eyebrow = "CERTIFICATE OF PARTICIPATION";
        int eyebrowWidth = g.getFontMetrics().stringWidth(eyebrow);
        g.drawString(eyebrow, w - pad - eyebrowWidth, Math.round(56 * s));

        // Divider under header.
        g.setColor(DIVIDER);
        g.setStroke(new BasicStroke(Math.max(1f, 1 * s)));
        g.drawLine(pad, Math.round(76 * s), w - pad, Math.round(76 * s));

        // "This certifies that" / "has attended and completed" captions
        // around where f-name / f-event will be stamped.
        g.setColor(MUTED);
        g.setFont(new Font("SansSerif", Font.PLAIN, Math.round(12 * s)));
        drawCentered(g, "This certifies that", w / 2, Math.round(0.32f * h) - Math.round(30 * s));
        drawCentered(g, "has attended and completed", w / 2, Math.round(0.32f * h) + Math.round(28 * s));

        // Signature line, bottom-left — decorative, not one of the stamped fields.
        int sigY = Math.round(0.80f * h);
        g.setColor(INK);
        g.drawLine(Math.round(0.20f * w), sigY, Math.round(0.35f * w), sigY);
        g.setColor(MUTED);
        g.setFont(new Font("Courier New", Font.PLAIN, Math.round(9 * s)));
        drawCentered(g, "Prof. Andrei Volkov", Math.round(0.275f * w), sigY + Math.round(16 * s));

        // Bottom divider.
        g.setColor(DIVIDER);
        g.drawLine(pad, Math.round(0.88f * h), w - pad, Math.round(0.88f * h));

        g.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }

    private static void drawCentered(Graphics2D g, String text, int centerX, int y) {
        int textWidth = g.getFontMetrics().stringWidth(text);
        g.drawString(text, centerX - textWidth / 2, y);
    }
}
