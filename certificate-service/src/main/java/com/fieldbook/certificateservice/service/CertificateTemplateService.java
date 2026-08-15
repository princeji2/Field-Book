package com.fieldbook.certificateservice.service;

import com.fieldbook.certificateservice.model.CertificateTemplate;
import com.fieldbook.certificateservice.supabase.SupabaseClient;
import org.springframework.stereotype.Service;

/**
 * Loads certificate templates from Supabase.
 *
 * <p>Delegates to {@link SupabaseClient} for the actual PostgREST call.
 * A missing template surfaces as
 * {@link com.fieldbook.certificateservice.exception.TemplateNotFoundException},
 * which the controller advice translates to HTTP 404.</p>
 */
@Service
public class CertificateTemplateService {

    private final SupabaseClient supabase;

    public CertificateTemplateService(SupabaseClient supabase) {
        this.supabase = supabase;
    }

    public CertificateTemplate fetchTemplate(String templateId) {
        return supabase.fetchTemplate(templateId);
    }
}
