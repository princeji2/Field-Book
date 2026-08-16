package com.fieldbook.certificateservice.service;

import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.util.Matrix;

import java.io.IOException;

/**
 * Draws the Fieldbook "Seal" motif directly onto a PDF page using PDFBox
 * path and fill primitives — a static, non-animated reproduction of the
 * {@code CertificateSeal} React component in {@code src/app/shared.tsx}
 * (see the {@code design-system} steering doc, "The Seal — canonical
 * implementation").
 *
 * <p>The geometry below is derived point-for-point from that component: a
 * 64-point scalloped ring, a solid inner ring, a dashed outer ring, the arc
 * text "&middot; FIELDBOOK &middot; VERIFIED &middot;" running along the
 * top, and a three-point checkmark stroke. Colors, radii, and proportions
 * are locked to that source — do not change them independently of the
 * React version.</p>
 *
 * <h3>Coordinate system note</h3>
 * <p>The SVG source uses a y-down coordinate space; PDF content streams use
 * y-up. Every point below is computed by negating the y-offset relative to
 * the seal's own center ({@code r, r}), which exactly cancels the axis flip
 * and reproduces the same picture — not a mirror image — once drawn in PDF
 * space.</p>
 *
 * <h3>Known approximation</h3>
 * <p>PDFBox has no text-on-a-path primitive. The arc text is reproduced by
 * measuring each glyph's advance width, converting that to an angular width
 * ({@code width / arcRadius}), and placing + rotating each glyph individually
 * so it stays tangent to the curve. This matches the SVG's
 * {@code <textPath startOffset="50%" textAnchor="middle">} centering
 * behavior closely but is a numerical approximation rather than a vector
 * reproduction of the path-text layout algorithm.</p>
 */
final class CertificateSealRenderer {

    // ── Geometry constants, copied from the React component's literals ──
    private static final float FILL_MARIGOLD_INSET = 8f;      // r - 8
    private static final float RING_SOLID_INSET = 10.5f;      // r - 10.5
    private static final float RING_DASHED_INSET = 17.5f;     // r - 17.5
    private static final float ARC_TEXT_INSET = 14f;          // r - 14
    private static final float[] DASH_PATTERN = {2f, 1.5f};
    private static final float ARC_TEXT_LETTER_SPACING = 1.1f; // fixed unit, not scaled by size
    private static final String ARC_TEXT = "\u00B7 FIELDBOOK \u00B7 VERIFIED \u00B7";

    // ── Palette (design-system tokens: Ink #1E1B16, Marigold #E2A23B) ──
    private static final float INK_R = 0x1E / 255f;
    private static final float INK_G = 0x1B / 255f;
    private static final float INK_B = 0x16 / 255f;
    private static final float MARIGOLD_R = 0xE2 / 255f;
    private static final float MARIGOLD_G = 0xA2 / 255f;
    private static final float MARIGOLD_B = 0x3B / 255f;

    private CertificateSealRenderer() {
    }

    /**
     * Draws the Seal centered at ({@code cx}, {@code cy}) in page (PDF)
     * coordinates.
     *
     * @param cs        the open content stream to draw into
     * @param cx        center x, in points
     * @param cy        center y, in points
     * @param size      overall diameter of the seal, in points
     * @param rotateDeg rotation using the same convention as the React
     *                  {@code rotate} prop: a negative value between -7 and
     *                  -11 for the hand-stamped tilt. The sign is flipped
     *                  internally to convert CSS's clockwise-positive
     *                  rotation convention into PDF's counterclockwise-
     *                  positive one, so passing -9 here produces the same
     *                  visual tilt as {@code rotate={-9}} in React.
     * @param monoFont  embedded IBM Plex Mono font used for the arc text
     */
    static void draw(PDPageContentStream cs, float cx, float cy, float size,
                      float rotateDeg, PDFont monoFont) throws IOException {
        float r = size / 2f;

        cs.saveGraphicsState();
        // Rotate around the seal's own center, then place at (cx, cy).
        // transform() calls compose so the LAST call is applied FIRST to
        // raw drawing coordinates (standard PDF/Graphics2D nesting), so:
        //   1) translate(-r,-r) recenters local (r,r) to the origin,
        //   2) rotate-and-place-at-(cx,cy) then rotates that centered
        //      shape around the origin and moves the result to (cx, cy).
        cs.transform(Matrix.getRotateInstance(Math.toRadians(-rotateDeg), cx, cy));
        cs.transform(Matrix.getTranslateInstance(-r, -r));

        drawScallopedRing(cs, r);
        drawFilledCircle(cs, r, r, r - FILL_MARIGOLD_INSET);
        strokeCircle(cs, r, r, r - RING_SOLID_INSET, 0.75f, null);
        strokeCircle(cs, r, r, r - RING_DASHED_INSET, 0.75f, DASH_PATTERN);

        float arcR = r - ARC_TEXT_INSET;
        float fontSize = Math.max(4.5f, size * 0.061f);
        drawArcText(cs, monoFont, ARC_TEXT, r, r, arcR, fontSize);

        float strokeWidth = Math.max(1.5f, size * 0.027f);
        drawCheckmark(cs, r, strokeWidth);

        cs.restoreGraphicsState();
    }

    /** The 64-point scalloped outer ring, alternating radius r-1 / r-5.5. */
    private static void drawScallopedRing(PDPageContentStream cs, float r) throws IOException {
        int n = 64;
        cs.setNonStrokingColor(MARIGOLD_R, MARIGOLD_G, MARIGOLD_B);
        for (int i = 0; i < n; i++) {
            double a = (i / (double) n) * Math.PI * 2 - Math.PI / 2;
            float rad = (i % 2 == 0) ? (r - 1f) : (r - 5.5f);
            float x = (float) (r + Math.cos(a) * rad);
            float y = (float) (r - Math.sin(a) * rad); // negated: y-down -> y-up
            if (i == 0) {
                cs.moveTo(x, y);
            } else {
                cs.lineTo(x, y);
            }
        }
        cs.closePath();
        cs.fill();
    }

    private static void drawFilledCircle(PDPageContentStream cs, float cx, float cy, float radius)
            throws IOException {
        cs.setNonStrokingColor(MARIGOLD_R, MARIGOLD_G, MARIGOLD_B);
        addCirclePath(cs, cx, cy, radius);
        cs.fill();
    }

    private static void strokeCircle(PDPageContentStream cs, float cx, float cy, float radius,
                                      float lineWidth, float[] dashPattern) throws IOException {
        cs.setStrokingColor(INK_R, INK_G, INK_B);
        cs.setLineWidth(lineWidth);
        cs.setLineDashPattern(dashPattern != null ? dashPattern : new float[0], 0f);
        addCirclePath(cs, cx, cy, radius);
        cs.stroke();
    }

    /** Approximates a circle with four cubic Bezier curves (k = 0.5522847498 constant). */
    private static void addCirclePath(PDPageContentStream cs, float cx, float cy, float radius)
            throws IOException {
        float k = 0.5522847498f * radius;
        cs.moveTo(cx + radius, cy);
        cs.curveTo(cx + radius, cy + k, cx + k, cy + radius, cx, cy + radius);
        cs.curveTo(cx - k, cy + radius, cx - radius, cy + k, cx - radius, cy);
        cs.curveTo(cx - radius, cy - k, cx - k, cy - radius, cx, cy - radius);
        cs.curveTo(cx + k, cy - radius, cx + radius, cy - k, cx + radius, cy);
        cs.closePath();
    }

    /**
     * Places each glyph of {@code text} along the top semicircle of radius
     * {@code arcR} around ({@code cx}, {@code cy}), centered on the apex
     * (12 o'clock) — reproducing the SVG {@code <textPath startOffset="50%"
     * textAnchor="middle">} layout. See the class doc for the approximation
     * this makes (no native text-on-path support in PDFBox).
     */
    private static void drawArcText(PDPageContentStream cs, PDFont font, String text,
                                     float cx, float cy, float arcR, float fontSize) throws IOException {
        int len = text.length();
        float[] widths = new float[len];
        float totalWidth = 0f;
        for (int i = 0; i < len; i++) {
            float w = font.getStringWidth(text.substring(i, i + 1)) / 1000f * fontSize;
            widths[i] = w;
            totalWidth += w + ARC_TEXT_LETTER_SPACING;
        }
        totalWidth -= ARC_TEXT_LETTER_SPACING; // no trailing gap after the last glyph

        float totalAngle = totalWidth / arcR; // radians; small-angle arc-length approximation
        double theta = Math.PI / 2 + totalAngle / 2; // start left of the apex, sweeping right

        cs.setNonStrokingColor(INK_R, INK_G, INK_B);
        for (int i = 0; i < len; i++) {
            double glyphAngle = widths[i] / arcR;
            double midTheta = theta - glyphAngle / 2;

            float x = (float) (cx + Math.cos(midTheta) * arcR);
            float y = (float) (cy + Math.sin(midTheta) * arcR);
            // Tangent direction for left-to-right reading as theta decreases
            // moving from the 9 o'clock point, over the apex, to 3 o'clock.
            double rotation = Math.atan2(-Math.cos(midTheta), Math.sin(midTheta));

            cs.beginText();
            cs.setFont(font, fontSize);
            cs.setTextMatrix(Matrix.getRotateInstance(rotation, x, y));
            cs.showText(text.substring(i, i + 1));
            cs.endText();

            theta -= glyphAngle + (ARC_TEXT_LETTER_SPACING / arcR);
        }
    }

    /** The three-point checkmark stroke, round cap/join, matching the SVG path literals. */
    private static void drawCheckmark(PDPageContentStream cs, float r, float strokeWidth) throws IOException {
        float x0 = r - r * 0.22f, y0 = r - r * 0.04f; // dy negated (y-down -> y-up)
        float x1 = r - r * 0.03f, y1 = r - r * 0.22f;
        float x2 = r + r * 0.26f, y2 = r + r * 0.18f;

        cs.setStrokingColor(INK_R, INK_G, INK_B);
        cs.setLineWidth(strokeWidth);
        cs.setLineCapStyle(1);  // round
        cs.setLineJoinStyle(1); // round
        cs.setLineDashPattern(new float[0], 0f);
        cs.moveTo(x0, y0);
        cs.lineTo(x1, y1);
        cs.lineTo(x2, y2);
        cs.stroke();
    }
}
