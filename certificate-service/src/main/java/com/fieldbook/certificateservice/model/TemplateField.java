package com.fieldbook.certificateservice.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One placeable field on a certificate template, as stored in
 * certificate_templates.fields (a JSON array in Supabase).
 *
 * <p>Coordinates are percentages of the canvas (0-100), center-anchored -
 * the frontend uses {@code transform: translate(-50%, -50%)} when
 * positioning the field on its preview canvas, so the same convention
 * applies here.</p>
 *
 * <p>Unknown JSON properties (e.g. {@code label}, {@code placeholder},
 * {@code isCustom}) are ignored - they're used by the frontend editor
 * but don't affect stamping.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class TemplateField {

    /** Well-known field ids the certificate service knows how to fill. */
    public static final String ID_STUDENT_NAME = "f-name";
    public static final String ID_EVENT_TITLE = "f-event";
    public static final String ID_CERTIFICATE_CODE = "f-id";

    private String id;
    private boolean enabled = true;
    private String fontFamily = "serif";
    private String size = "md";
    private double x;
    private double y;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getFontFamily() {
        return fontFamily;
    }

    public void setFontFamily(String fontFamily) {
        this.fontFamily = fontFamily == null ? "serif" : fontFamily;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size == null ? "md" : size;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }
}
