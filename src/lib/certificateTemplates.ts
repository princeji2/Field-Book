import { supabase } from "./supabaseClient";

// Read access to the `certificate_templates` table for the organizer
// event-create/edit form's template picker. Distinct from lib/certificates.ts
// (the certificate-service HTTP client) and admin/templates.tsx (the admin
// template editor): this module only LISTS existing templates so an organizer
// can attach one to their event via events.certificate_template_id.
//
// Reading is permitted by the certificate_templates_select_staff RLS policy
// (is_admin() OR is_organizer()); organizers cannot create/edit templates,
// only select from the admin-curated set.

/** One certificate template, as needed by the event form's dropdown. */
export interface CertificateTemplateOption {
  id: string;
  name: string;
  isDefault: boolean;
}

export type ListCertificateTemplatesResult =
  | { status: "success"; templates: CertificateTemplateOption[] }
  | { status: "error"; message: string };

// Row shape as returned by PostgREST (snake_case).
interface CertificateTemplateRow {
  id: string;
  name: string;
  is_default: boolean | null;
}

/**
 * Lists all certificate templates, default first then by name, for the
 * organizer event form's template picker. Returns a discriminated result
 * rather than throwing, matching the convention in lib/events.ts /
 * lib/roleRequests.ts so callers can handle success/error without try/catch.
 */
export async function listCertificateTemplates(): Promise<ListCertificateTemplatesResult> {
  const { data, error } = await supabase
    .from("certificate_templates")
    .select("id, name, is_default")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) return { status: "error", message: error.message };

  const templates: CertificateTemplateOption[] = ((data ?? []) as CertificateTemplateRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    isDefault: row.is_default ?? false,
  }));

  return { status: "success", templates };
}
