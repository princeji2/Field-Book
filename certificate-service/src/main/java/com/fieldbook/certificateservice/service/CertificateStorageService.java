package com.fieldbook.certificateservice.service;

import com.fieldbook.certificateservice.config.SupabaseProperties;
import com.fieldbook.certificateservice.supabase.SupabaseClient;
import org.springframework.stereotype.Service;

/**
 * Uploads generated certificate PDFs to the "certificates" Supabase Storage
 * bucket and returns the resulting public URL.
 *
 * <p>The bucket must exist and be marked public in the Supabase dashboard.
 * The object path is derived from the certificate code so that the same
 * certificate can be regenerated deterministically (uploads use
 * {@code x-upsert: true} to overwrite).</p>
 */
@Service
public class CertificateStorageService {

    private final SupabaseClient supabase;
    private final SupabaseProperties props;

    public CertificateStorageService(SupabaseClient supabase, SupabaseProperties props) {
        this.supabase = supabase;
        this.props = props;
    }

    public String uploadCertificate(byte[] pdfBytes, String certificateCode) {
        String objectPath = safeObjectPath(certificateCode) + ".pdf";
        return supabase.uploadToBucket(
                props.getCertificatesBucket(),
                objectPath,
                pdfBytes,
                "application/pdf"
        );
    }

    /**
     * Sanitizes the certificate code into something safe to use as a Storage
     * object key: strip anything outside a small allow-list, so we never
     * accidentally build a path with slashes or control characters.
     */
    private static String safeObjectPath(String certificateCode) {
        String cleaned = certificateCode == null ? "" : certificateCode.trim();
        StringBuilder sb = new StringBuilder(cleaned.length());
        for (int i = 0; i < cleaned.length(); i++) {
            char c = cleaned.charAt(i);
            if (Character.isLetterOrDigit(c) || c == '-' || c == '_' || c == '.') {
                sb.append(c);
            } else {
                sb.append('_');
            }
        }
        String result = sb.toString();
        return result.isBlank() ? "certificate" : result;
    }
}
