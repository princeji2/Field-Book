package com.fieldbook.certificateservice.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for POST /api/certificates/generate.
 *
 * @param studentName      full name of the student to stamp on the certificate
 * @param eventTitle       title of the event the certificate is issued for
 * @param templateId       id of the certificate_templates row to render onto
 * @param certificateCode  unique code identifying this certificate instance;
 *                         becomes the {@code certificates.certificate_code}
 *                         value and the Storage object's filename
 * @param eventId          optional id of the {@code events} row this
 *                         certificate is for. Nullable — {@code certificates.event_id}
 *                         allows null, and callers that don't yet have a real
 *                         event UUID (e.g. still-mock frontend data) can omit it.
 * @param studentId        optional id of the {@code profiles} row (the
 *                         signed-in student) this certificate belongs to.
 *                         Nullable for the same reason as {@code eventId}.
 */
public record CertificateRequest(
        @NotBlank(message = "studentName is required")
        String studentName,

        @NotBlank(message = "eventTitle is required")
        String eventTitle,

        @NotBlank(message = "templateId is required")
        String templateId,

        @NotBlank(message = "certificateCode is required")
        String certificateCode,

        String eventId,

        String studentId
) {
}
