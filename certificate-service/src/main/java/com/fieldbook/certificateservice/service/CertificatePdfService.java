package com.fieldbook.certificateservice.service;

import com.fieldbook.certificateservice.exception.SupabaseIntegrationException;
import com.fieldbook.certificateservice.model.CertificateTemplate;
import com.fieldbook.certificateservice.model.TemplateField;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Renders a certificate PDF by placing the supplied text values onto the
 * background image at the coordinates defined in the template's fields JSON.
 *
 * <h3>Coordinate system</h3>
 * <ul>
 *   <li>Each field's {@code x} and {@code y} are percentages (0–100) of the
 *       page dimensions.</li>
 *   <li>The frontend anchors fields at their center
 *       ({@code translate(-50%, -50%)}), so the same convention is applied
 *       here when stamping.</li>
 *   <li>PDF space has its origin at the bottom-left; the y percentage is
 *       measured from the top, so it's flipped when converting.</li>
 * </ul>
 *
 * <h3>Font sizing</h3>
 * Field sizes are categorical ({@code xl}/{@code lg}/{@code md}/{@code sm}).
 * They match the frontend's editor at {@code CANVAS_W = 560}px, so we scale
 * them proportionally to the actual PDF width.
 */
@Service
public class CertificatePdfService {

    /** Base page width in points. A4 landscape width; matches the frontend's default aspect ratio. */
    private static final float BASE_PAGE_WIDTH = 842f;

    /** Frontend editor canvas width in CSS pixels — used to scale font sizes. */
    private static final float FRONTEND_CANVAS_WIDTH = 560f;

    /** Categorical field sizes as they appear in the frontend editor, in the frontend's pixel units. */
    private static final Map<String, Float> FRONTEND_FONT_SIZES = Map.of(
            "xl", 28f,
            "lg", 18f,
            "md", 14f,
            "sm", 11f
    );

    /**
     * Renders the certificate as a PDF and returns the raw bytes.
     *
     * @param template         template row fetched from Supabase (must have a background image URL)
     * @param backgroundImage  bytes of the downloaded background image (PNG or JPEG)
     * @param studentName      value to stamp into the {@code f-name} field
     * @param eventTitle       value to stamp into the {@code f-event} field
     * @param certificateCode  value to stamp into the {@code f-id} field
     */
    public byte[] render(CertificateTemplate template, byte[] backgroundImage,
                         String studentName, String eventTitle, String certificateCode) throws IOException {

        float pageWidth = BASE_PAGE_WIDTH;
        float aspectRatio = template.getAspectRatio() != null && template.getAspectRatio() > 0
                ? template.getAspectRatio().floatValue()
                : 1.4142f; // A4 landscape default
        float pageHeight = pageWidth / aspectRatio;

        Map<String, String> fieldValues = new HashMap<>();
        fieldValues.put(TemplateField.ID_STUDENT_NAME, studentName);
        fieldValues.put(TemplateField.ID_EVENT_TITLE, eventTitle);
        fieldValues.put(TemplateField.ID_CERTIFICATE_CODE, certificateCode);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(new PDRectangle(pageWidth, pageHeight));
            document.addPage(page);

            PDImageXObject background = PDImageXObject.createFromByteArray(
                    document, backgroundImage, "background");

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                // Draw the template's background image edge-to-edge.
                content.drawImage(background, 0, 0, pageWidth, pageHeight);

                float scale = pageWidth / FRONTEND_CANVAS_WIDTH;

                if (template.getFields() != null) {
                    for (TemplateField field : template.getFields()) {
                        if (field == null || !field.isEnabled() || field.getId() == null) continue;

                        String text = fieldValues.get(field.getId());
                        if (text == null || text.isBlank()) continue; // only stamp the three we care about

                        stampField(content, field, text, pageWidth, pageHeight, scale);
                    }
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            // Wrap image-decode failures with a clearer, callable message.
            throw new SupabaseIntegrationException(
                    "Failed to render certificate PDF (background image may be an unsupported format): "
                            + e.getMessage(), e);
        }
    }

    private void stampField(PDPageContentStream content, TemplateField field, String text,
                            float pageWidth, float pageHeight, float scale) throws IOException {
        PDFont font = resolveFont(field.getFontFamily());
        float fontSize = resolveFontSize(field.getSize()) * scale;

        float centerX = clampPercent(field.getX()) / 100f * pageWidth;
        // y percentage is measured from the top in the frontend, PDF origin is bottom-left.
        float centerY = pageHeight - (clampPercent(field.getY()) / 100f * pageHeight);

        float textWidth = font.getStringWidth(text) / 1000f * fontSize;
        float ascent = font.getFontDescriptor().getAscent() / 1000f * fontSize;
        float descent = font.getFontDescriptor().getDescent() / 1000f * fontSize; // negative

        // Center-anchor: subtract half the width horizontally, and offset vertically so the
        // visual center of the glyph box lines up with centerY.
        float x = centerX - textWidth / 2f;
        float y = centerY - (ascent + descent) / 2f;

        content.beginText();
        content.setFont(font, fontSize);
        content.newLineAtOffset(x, y);
        content.showText(text);
        content.endText();
    }

    private static float clampPercent(double v) {
        if (Double.isNaN(v)) return 50f;
        return (float) Math.max(0.0, Math.min(100.0, v));
    }

    private static PDFont resolveFont(String family) {
        // Standard-14 fonts avoid the need to embed anything and cover the three
        // families the frontend exposes. Names get stamped with a bold weight
        // for readability, matching the frontend's font-weight:600 styling.
        String f = family == null ? "serif" : family.toLowerCase();
        return switch (f) {
            case "mono" -> new PDType1Font(Standard14Fonts.FontName.COURIER_BOLD);
            case "sans" -> new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            default -> new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD);
        };
    }

    private static float resolveFontSize(String size) {
        String s = size == null ? "md" : size.toLowerCase();
        return FRONTEND_FONT_SIZES.getOrDefault(s, FRONTEND_FONT_SIZES.get("md"));
    }
}
