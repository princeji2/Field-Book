package com.fieldbook.certificateservice.dto;

/**
 * Response body for POST /api/certificates/generate.
 *
 * @param certificateUrl public URL of the generated PDF in Supabase Storage
 */
public record CertificateResponse(String certificateUrl) {
}
