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
     * Generates a certificate PDF from a Supabase-backed template and
     * uploads it to the {@code certificates} Storage bucket.
     *
     * <p>Flow:</p>
     * <ol>
     *   <li>Fetch the template row (background_image_url, aspect_ratio, fields).</li>
     *   <li>Download the background image.</li>
     *   <li>Stamp {@code studentName}, {@code eventTitle}, and
     *       {@code certificateCode} onto the image at the positions defined
     *       in {@code fields}.</li>
     *   <li>Upload the finished PDF to Supabase Storage.</li>
     *   <li>Return the public URL as {@code { "certificateUrl": ... }}.</li>
     * </ol>
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
        return ResponseEntity.ok(new CertificateResponse(publicUrl));
    }
}
