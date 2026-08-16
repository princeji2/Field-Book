package com.fieldbook.certificateservice.controller;

import com.fieldbook.certificateservice.dto.CertificateRequest;
import com.fieldbook.certificateservice.dto.CertificateResponse;
import com.fieldbook.certificateservice.model.CertificateTemplate;
import com.fieldbook.certificateservice.service.CertificatePdfService;
import com.fieldbook.certificateservice.service.CertificateStorageService;
import com.fieldbook.certificateservice.service.CertificateTemplateService;
import com.fieldbook.certificateservice.supabase.SupabaseClient;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateTemplateService templateService;
    private final CertificatePdfService pdfService;
    private final CertificateStorageService storageService;
    private final SupabaseClient supabase;

    public CertificateController(CertificateTemplateService templateService,
                                 CertificatePdfService pdfService,
                                 CertificateStorageService storageService,
                                 SupabaseClient supabase) {
        this.templateService = templateService;
        this.pdfService = pdfService;
        this.storageService = storageService;
        this.supabase = supabase;
    }

    /**
     * Generates a certificate PDF from a Supabase-backed template, uploads
     * it to the {@code certificates} Storage bucket, and records the issued
     * certificate.
     *
     * <p>Flow:</p>
     * <ol>
     *   <li>Fetch the template row (background_image_url, aspect_ratio, fields).</li>
     *   <li>Download the background image.</li>
     *   <li>Stamp {@code studentName}, {@code eventTitle}, and
     *       {@code certificateCode} onto the image at the positions defined
     *       in {@code fields}.</li>
     *   <li>Upload the finished PDF to Supabase Storage.</li>
     *   <li>Insert a row into {@code certificates} (event_id, student_id,
     *       template_id, certificate_code, certificate_url) using the
     *       service-role key — the only write path for this table; see
     *       {@link SupabaseClient#insertCertificateRecord}.</li>
     *   <li>Return the public URL as {@code { "certificateUrl": ... }}.</li>
     * </ol>
     *
     * <p>The Storage upload and the certificates-table insert are not
     * wrapped in a single transaction (they're two different backends —
     * Storage and PostgREST). If the insert fails after a successful
     * upload, the PDF still exists in Storage and the generated URL is
     * still valid; only the row bookkeeping is missing. That failure
     * surfaces to the caller as a 502 rather than being swallowed, so it's
     * visible rather than silently lost.</p>
     *
     * @return 200 with the public URL, 400 for validation errors, 404 if the
     *         template id doesn't exist, 502 for other Supabase failures.
     */
    @PostMapping("/generate")
    public ResponseEntity<CertificateResponse> generate(@Valid @RequestBody CertificateRequest request)
            throws IOException {

        CertificateTemplate template = templateService.fetchTemplate(request.templateId());

        if (template.getBackgroundImageUrl() == null || template.getBackgroundImageUrl().isBlank()) {
            throw new IllegalStateException(
                    "Template " + request.templateId() + " has no background_image_url set.");
        }

        byte[] background = supabase.downloadBytes(template.getBackgroundImageUrl());
        byte[] pdfBytes = pdfService.render(
                template, background,
                request.studentName(), request.eventTitle(), request.certificateCode()
        );

        String publicUrl = storageService.uploadCertificate(pdfBytes, request.certificateCode());

        supabase.insertCertificateRecord(
                request.eventId(), request.studentId(), request.templateId(),
                request.certificateCode(), publicUrl
        );

        return ResponseEntity.ok(new CertificateResponse(publicUrl));
    }
}
