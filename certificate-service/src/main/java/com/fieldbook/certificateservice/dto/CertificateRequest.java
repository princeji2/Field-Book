package com.fieldbook.certificateservice.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for POST /api/certificates/generate.
 *
 * @param studentName      full name of the student to stamp on the certificate
 * @param eventTitle       title of the event the certificate is issued for
 * @param templateId       identifier of the certificate template to use
 *                         (currently unused - stub always returns a placeholder PDF;
 *                         will be used once Supabase template lookup is wired in)
 * @param certificateCode  unique code identifying this certificate instance
 *                         (currently unused by the stub; reserved for the real
 *                         implementation)
 */
public record CertificateRequest(
        @NotBlank(message = "studentName is required")
        String studentName,

        @NotBlank(message = "eventTitle is required")
        String eventTitle,

        @NotBlank(message = "templateId is required")
        String templateId,

        @NotBlank(message = "certificateCode is required")
        String certificateCode
) {
}
