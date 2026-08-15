package com.fieldbook.certificateservice.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * A row from the {@code certificate_templates} table.
 *
 * <p>{@code aspect_ratio} is width / height (e.g. 1.4142 for A4 landscape,
 * matching the frontend's default).</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CertificateTemplate {

    private String id;

    @JsonAlias({"background_image_url", "backgroundImageUrl"})
    private String backgroundImageUrl;

    @JsonAlias({"aspect_ratio", "aspectRatio"})
    private Double aspectRatio;

    private List<TemplateField> fields = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBackgroundImageUrl() {
        return backgroundImageUrl;
    }

    public void setBackgroundImageUrl(String backgroundImageUrl) {
        this.backgroundImageUrl = backgroundImageUrl;
    }

    public Double getAspectRatio() {
        return aspectRatio;
    }

    public void setAspectRatio(Double aspectRatio) {
        this.aspectRatio = aspectRatio;
    }

    public List<TemplateField> getFields() {
        return fields;
    }

    public void setFields(List<TemplateField> fields) {
        this.fields = fields == null ? new ArrayList<>() : fields;
    }
}
