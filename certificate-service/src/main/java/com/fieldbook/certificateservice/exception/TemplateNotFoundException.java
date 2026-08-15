package com.fieldbook.certificateservice.exception;

/**
 * Thrown when the requested certificate template id does not exist in the
 * Supabase {@code certificate_templates} table. Translated to a 404 response
 * by the controller advice.
 */
public class TemplateNotFoundException extends RuntimeException {
    public TemplateNotFoundException(String templateId) {
        super("Certificate template not found: " + templateId);
    }
}
