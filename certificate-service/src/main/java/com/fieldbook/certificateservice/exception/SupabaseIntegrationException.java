package com.fieldbook.certificateservice.exception;

/**
 * Raised when a call to Supabase fails for any reason other than a missing
 * template row (network error, non-2xx PostgREST/Storage response, upload
 * failure, misconfigured credentials, etc). Translated to a 502-style error
 * response by the controller advice.
 */
public class SupabaseIntegrationException extends RuntimeException {
    public SupabaseIntegrationException(String message) {
        super(message);
    }

    public SupabaseIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
