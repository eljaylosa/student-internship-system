import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

Deno.serve(async (req) => {
  // =========================================================
  // CORS
  // =========================================================

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // =========================================================
  // METHOD
  // =========================================================

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed.",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    // =======================================================
    // SUPABASE ADMIN CLIENT
    // =======================================================

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase environment variables are not configured.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // =======================================================
    // REQUEST BODY
    // =======================================================

    const body = await req.json();

    const { token, businessRegistration, birRegistration, supportingDocument } =
      body;

    // =======================================================
    // BASIC VALIDATION
    // =======================================================

    if (!token) {
      throw new Error("Verification token is required.");
    }

    if (!businessRegistration) {
      throw new Error("Business registration document is required.");
    }

    if (!birRegistration) {
      throw new Error("BIR registration document is required.");
    }

    // =======================================================
    // FIND VERIFICATION REQUEST
    // =======================================================

    const { data: verificationRequest, error: requestError } = await supabase
      .from("company_verification_requests")
      .select(
        `
          id,
          company_id,
          token,
          expires_at,
          used_at,
          companies (
            id,
            company_name,
            status,
            business_registration_url,
            bir_registration_url,
            supporting_document_url
          )
        `
      )
      .eq("token", token)
      .maybeSingle();

    if (requestError) {
      console.error("Verification request lookup error:", requestError);

      throw new Error("Unable to validate verification request.");
    }

    // =======================================================
    // TOKEN NOT FOUND
    // =======================================================

    if (!verificationRequest) {
      throw new Error("Invalid verification link.");
    }

    // =======================================================
    // EXPIRATION
    // =======================================================

    const expiresAt = new Date(verificationRequest.expires_at);

    if (expiresAt <= new Date()) {
      throw new Error("This verification link has expired.");
    }

    // =======================================================
    // TOKEN ALREADY USED
    // =======================================================

    if (verificationRequest.used_at) {
      throw new Error("This verification link has already been used.");
    }

    // =======================================================
    // COMPANY
    // =======================================================

    const company = verificationRequest.companies;

    if (!company) {
      throw new Error(
        "The company associated with this verification request could not be found."
      );
    }

    // =======================================================
    // COMPANY STATUS
    // =======================================================

    if (company.status !== "pending") {
      throw new Error(
        "This company verification request is no longer pending."
      );
    }

    // =======================================================
    // FILE VALIDATION HELPER
    // =======================================================

    const validateFile = (
      fileData: any,
      documentName: string,
      required = false
    ) => {
      if (!fileData) {
        if (required) {
          throw new Error(`${documentName} is required.`);
        }

        return;
      }

      if (!fileData.data) {
        throw new Error(`Invalid file data for ${documentName}.`);
      }

      const contentType = fileData.type || "application/octet-stream";

      if (!ALLOWED_TYPES.includes(contentType)) {
        throw new Error(
          `${documentName} must be a PDF, JPG, JPEG, or PNG file.`
        );
      }

      const base64Data = fileData.data.split(",")[1];

      if (!base64Data) {
        throw new Error(`Invalid file data for ${documentName}.`);
      }

      /*
       * Base64 is approximately 4/3 the original
       * file size.
       */
      const estimatedSize = Math.floor((base64Data.length * 3) / 4);

      if (estimatedSize > MAX_FILE_SIZE) {
        throw new Error(`${documentName} must not exceed 10 MB.`);
      }
    };

    // =======================================================
    // VALIDATE FILES
    // =======================================================

    validateFile(businessRegistration, "Business Registration", true);

    validateFile(birRegistration, "BIR Registration", true);

    validateFile(supportingDocument, "Supporting Document", false);

    // =======================================================
    // SANITIZE ORIGINAL FILE NAME
    // =======================================================

    const sanitizeFileName = (fileName: string) => {
      if (!fileName) {
        return "document";
      }

      /*
       * Keep the user's original filename as much as possible,
       * while removing characters that should not be used
       * inside a Storage path.
       */
      const lastPart = fileName.split(/[\\/]/).pop() || "document";

      const sanitized = lastPart
        .replace(/[^\w.\-() ]+/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^\.+/, "")
        .trim();

      return sanitized || "document";
    };

    // =======================================================
    // FILE UPLOAD HELPER
    // =======================================================

    const uploadedPaths: string[] = [];

    const uploadFile = async (fileData: any, documentName: string) => {
      if (!fileData) {
        return null;
      }

      // -----------------------------------------------------
      // ORIGINAL FILENAME
      // -----------------------------------------------------

      const originalFileName = fileData.name || "document";

      const safeFileName = sanitizeFileName(originalFileName);

      const contentType = fileData.type || "application/octet-stream";

      // -----------------------------------------------------
      // STORAGE PATH
      // -----------------------------------------------------
      //
      // IMPORTANT:
      // The actual uploaded filename is preserved.
      //
      // Example:
      //
      // company/
      //   abc123/
      //     verification456/
      //       SEC-Certificate-2026.pdf
      //
      // This allows CompanyManagement to display:
      //
      // SEC-Certificate-2026.pdf
      //
      // instead of:
      //
      // business-registration.pdf
      //
      // -----------------------------------------------------

      const filePath = `company/${company.id}/${verificationRequest.id}/${safeFileName}`;

      const base64Data = fileData.data.split(",")[1];

      if (!base64Data) {
        throw new Error(`Invalid file data for ${documentName}.`);
      }

      const binaryString = atob(base64Data);

      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, bytes, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(
          `Failed to upload ${documentName}: ${uploadError.message}`
        );
      }

      uploadedPaths.push(filePath);

      return filePath;
    };

    // =======================================================
    // SAVE PREVIOUS FILE PATHS
    // =======================================================
    //
    // We keep these so they can be removed after the new
    // documents have been successfully saved.
    //
    // =======================================================

    const previousPaths = [
      company.business_registration_url,
      company.bir_registration_url,
      company.supporting_document_url,
    ].filter(Boolean);

    // =======================================================
    // UPLOAD DOCUMENTS
    // =======================================================

    const businessRegistrationPath = await uploadFile(
      businessRegistration,
      "Business Registration"
    );

    const birRegistrationPath = await uploadFile(
      birRegistration,
      "BIR Registration"
    );

    const supportingDocumentPath = await uploadFile(
      supportingDocument,
      "Supporting Document"
    );

    // =======================================================
    // UPDATE COMPANY DOCUMENTS
    // =======================================================

    const companyUpdate: {
      business_registration_url: string,
      bir_registration_url: string,
      supporting_document_url?: string | null,
    } = {
      business_registration_url: businessRegistrationPath,

      bir_registration_url: birRegistrationPath,
    };

    /*
     * Supporting Document is optional.
     *
     * If the company uploads a new supporting document,
     * replace the old one.
     *
     * If no new supporting document was uploaded,
     * keep the previous document.
     */
    if (supportingDocumentPath) {
      companyUpdate.supporting_document_url = supportingDocumentPath;
    }

    const { error: companyUpdateError } = await supabase
      .from("companies")
      .update(companyUpdate)
      .eq("id", company.id);

    if (companyUpdateError) {
      console.error("Company document update error:", companyUpdateError);

      throw new Error(
        `Unable to save company documents: ${companyUpdateError.message}`
      );
    }

    // =======================================================
    // MARK TOKEN AS USED
    // =======================================================

    const usedAt = new Date().toISOString();

    const { data: updatedRequest, error: tokenUpdateError } = await supabase
      .from("company_verification_requests")
      .update({
        used_at: usedAt,
      })
      .eq("id", verificationRequest.id)
      .is("used_at", null)
      .select("id, used_at")
      .maybeSingle();

    if (tokenUpdateError) {
      console.error("Verification token update error:", tokenUpdateError);

      throw new Error(
        "Documents were uploaded, but the verification request could not be completed."
      );
    }

    if (!updatedRequest) {
      throw new Error("This verification link has already been used.");
    }

    // =======================================================
    // DELETE OLD DOCUMENTS
    // =======================================================
    //
    // Only remove previous files after the new files and
    // database update succeeded.
    //
    // This prevents old files from being deleted if the
    // upload/update fails.
    //
    // =======================================================

    const newPaths = uploadedPaths;

    const pathsToDelete = previousPaths.filter(
      (oldPath: string) => oldPath && !newPaths.includes(oldPath)
    );

    if (pathsToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from("verification-documents")
        .remove(pathsToDelete);

      if (deleteError) {
        /*
         * Do not fail the whole submission if cleanup
         * fails. The new documents are already saved
         * successfully.
         */
        console.warn(
          "Some previous verification documents could not be removed:",
          deleteError
        );
      }
    }

    // =======================================================
    // SUCCESS
    // =======================================================

    return new Response(
      JSON.stringify({
        success: true,

        message: "Company verification documents submitted successfully.",

        companyId: company.id,

        verificationRequestId: verificationRequest.id,

        submittedAt: usedAt,

        documents: {
          businessRegistration: businessRegistrationPath,

          birRegistration: birRegistrationPath,

          supportingDocument: supportingDocumentPath,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Company verification resubmission error:", error);

    return new Response(
      JSON.stringify({
        success: false,

        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
