import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const VerificationUpload = () => {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");

  const [company, setCompany] = useState(null);
  const [verification, setVerification] = useState(null);

  const [businessRegistration, setBusinessRegistration] = useState(null);
  const [birRegistration, setBirRegistration] = useState(null);
  const [supportingDocument, setSupportingDocument] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // =========================================================
  // VALIDATE VERIFICATION TOKEN
  // =========================================================

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("No verification token was provided.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const { data, error: functionError } = await supabase.functions.invoke(
          "validate-company-verification",
          {
            body: {
              token,
            },
          }
        );

        if (functionError) {
          console.error("Verification validation failed:", functionError);

          let message =
            functionError.message ||
            "Unable to validate this verification link.";

          if (functionError.context) {
            try {
              const responseBody = await functionError.context.json();

              if (responseBody?.error) {
                message = responseBody.error;
              }
            } catch {
              // Ignore response parsing errors
            }
          }

          throw new Error(message);
        }

        if (!data?.success) {
          throw new Error(data?.error || "This verification link is invalid.");
        }

        // =====================================================
        // VALID
        // =====================================================

        setVerification(data.verification || null);
        setCompany(data.company || null);
        setValid(true);
      } catch (error) {
        console.error("Company verification validation error:", error);

        setValid(false);

        setError(
          error?.message || "Unable to validate this verification link."
        );
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // =========================================================
  // FILE HANDLERS
  // =========================================================

  const handleFileChange = (setter, event) => {
    const file = event.target.files?.[0] || null;

    setter(file);
  };

  // =========================================================
  // FILE TO BASE64
  // =========================================================

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        resolve({
          name: file.name,
          type: file.type,
          data: reader.result,
        });
      };

      reader.onerror = () => {
        reject(new Error(`Unable to read ${file.name}.`));
      };

      reader.readAsDataURL(file);
    });
  };

  // =========================================================
  // SUBMIT DOCUMENTS
  // =========================================================

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setError("");

    // =======================================================
    // REQUIRED DOCUMENT VALIDATION
    // =======================================================

    if (!businessRegistration) {
      setError("Please upload your Business Registration document.");
      return;
    }

    if (!birRegistration) {
      setError("Please upload your BIR Registration document.");
      return;
    }

    // =======================================================
    // FILE SIZE VALIDATION
    // =======================================================

    const maxFileSize = 10 * 1024 * 1024;

    const files = [
      {
        file: businessRegistration,
        label: "Business Registration",
      },
      {
        file: birRegistration,
        label: "BIR Registration",
      },
      {
        file: supportingDocument,
        label: "Supporting Document",
      },
    ];

    for (const item of files) {
      if (item.file && item.file.size > maxFileSize) {
        setError(`${item.label} must not exceed 10 MB.`);
        return;
      }
    }

    // =======================================================
    // FILE TYPE VALIDATION
    // =======================================================

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    for (const item of files) {
      if (item.file && !allowedTypes.includes(item.file.type)) {
        setError(`${item.label} must be a PDF, JPG, JPEG, or PNG file.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // =====================================================
      // CONVERT FILES
      // =====================================================

      const businessRegistrationData = await fileToBase64(businessRegistration);

      const birRegistrationData = await fileToBase64(birRegistration);

      const supportingDocumentData = await fileToBase64(supportingDocument);

      // =====================================================
      // CALL EDGE FUNCTION
      // =====================================================

      const { data, error: functionError } = await supabase.functions.invoke(
        "resubmit-company-verification",
        {
          body: {
            token,

            businessRegistration: businessRegistrationData,

            birRegistration: birRegistrationData,

            supportingDocument: supportingDocumentData,
          },
        }
      );

      if (functionError) {
        console.error(
          "Company verification resubmission failed:",
          functionError
        );

        let message =
          functionError.message ||
          "Unable to submit your verification documents.";

        if (functionError.context) {
          try {
            const responseBody = await functionError.context.json();

            if (responseBody?.error) {
              message = responseBody.error;
            }
          } catch {
            // Ignore response parsing errors
          }
        }

        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(
          data?.error || "Unable to submit your verification documents."
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      setSubmitted(true);
    } catch (error) {
      console.error("Company verification submission error:", error);

      setError(
        error?.message ||
          "Something went wrong while submitting your documents."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 20px",
              borderRadius: "16px",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
            }}
          >
            🔐
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "700",
              color: "#0f172a",
            }}
          >
            Validating Verification Link
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Please wait while we securely verify your registration link.
          </p>

          <div
            style={{
              marginTop: "24px",
              width: "32px",
              height: "32px",
              marginLeft: "auto",
              marginRight: "auto",
              borderRadius: "50%",
              border: "3px solid #dbeafe",
              borderTopColor: "#2563eb",
              animation: "spin 1s linear infinite",
            }}
          />

          <style>
            {`
              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // =========================================================
  // SUBMISSION SUCCESS
  // =========================================================

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "550px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto 20px",
              borderRadius: "18px",
              background: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
            }}
          >
            ✓
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: "700",
              color: "#065f46",
            }}
          >
            Documents Submitted
          </h1>

          <p
            style={{
              marginTop: "12px",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            Your updated company verification documents have been successfully
            submitted for review.
          </p>

          <div
            style={{
              marginTop: "24px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              padding: "16px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#166534",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Company
            </div>

            <div
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "#14532d",
              }}
            >
              {company?.companyName || "Company"}
            </div>

            <p
              style={{
                margin: "8px 0 0",
                color: "#166534",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              SIMS Administration will review your updated documents and process
              your company verification.
            </p>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "#f8fafc",
              borderRadius: "8px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            This verification link can no longer be used.
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // INVALID / EXPIRED / USED
  // =========================================================

  if (!valid) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "550px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 20px",
              borderRadius: "16px",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
            }}
          >
            ⚠️
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "700",
              color: "#991b1b",
            }}
          >
            Verification Link Unavailable
          </h1>

          <p
            style={{
              marginTop: "12px",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>

          <div
            style={{
              marginTop: "24px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "14px",
              textAlign: "left",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: "700",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              What should I do?
            </p>

            <p
              style={{
                marginTop: "6px",
                marginBottom: 0,
                color: "#475569",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              Please contact SIMS Administration and request a new verification
              link if you believe this link should still be active.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VALID VERIFICATION PAGE
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 16px",
              borderRadius: "16px",
              background: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
            }}
          >
            ✅
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "700",
              color: "#0f172a",
            }}
          >
            Verification Documents
          </h1>

          <p
            style={{
              marginTop: "10px",
              marginBottom: 0,
              color: "#64748b",
              fontSize: "15px",
              lineHeight: 1.6,
            }}
          >
            Your verification link is valid. Please submit the corrected or
            updated documents requested by SIMS Administration.
          </p>
        </div>

        {/* COMPANY INFORMATION */}

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "18px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Company
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#0f172a",
            }}
          >
            {company?.companyName || "Company"}
          </div>

          <div
            style={{
              marginTop: "6px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            {company?.companyEmail}
          </div>

          {company?.industry && (
            <div
              style={{
                marginTop: "4px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Industry: {company.industry}
            </div>
          )}
        </div>

        {/* NOTICE */}

        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderLeft: "4px solid #2563eb",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              color: "#1e40af",
              marginBottom: "6px",
            }}
          >
            Action Required
          </div>

          <div
            style={{
              color: "#334155",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Your company registration has been reopened for review. Please
            upload the required verification documents before submitting this
            request again.
          </div>
        </div>

        {/* EXPIRATION */}

        {verification?.expiresAt && (
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#92400e",
                textTransform: "uppercase",
                marginBottom: "5px",
              }}
            >
              Link expiration
            </div>

            <div
              style={{
                color: "#78350f",
                fontSize: "13px",
              }}
            >
              {new Date(verification.expiresAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderLeft: "4px solid #dc2626",
              borderRadius: "8px",
              padding: "14px",
              marginBottom: "24px",
              color: "#991b1b",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {error}
          </div>
        )}

        {/* DOCUMENTS */}

        <div style={{ marginBottom: "28px" }}>
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "18px",
              color: "#0f172a",
            }}
          >
            Company Verification Documents
          </h2>

          {/* BUSINESS REGISTRATION */}

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "18px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontWeight: "600",
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Business Registration <span style={{ color: "#dc2626" }}>*</span>
            </div>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) =>
                handleFileChange(setBusinessRegistration, event)
              }
              disabled={isSubmitting}
            />

            {businessRegistration && (
              <div
                style={{
                  marginTop: "8px",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Selected: {businessRegistration.name}
              </div>
            )}
          </div>

          {/* BIR REGISTRATION */}

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "18px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontWeight: "600",
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              BIR Registration <span style={{ color: "#dc2626" }}>*</span>
            </div>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => handleFileChange(setBirRegistration, event)}
              disabled={isSubmitting}
            />

            {birRegistration && (
              <div
                style={{
                  marginTop: "8px",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Selected: {birRegistration.name}
              </div>
            )}
          </div>

          {/* SUPPORTING DOCUMENT */}

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "18px",
            }}
          >
            <div
              style={{
                fontWeight: "600",
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Supporting Document{" "}
              <span
                style={{
                  color: "#94a3b8",
                  fontWeight: "400",
                  fontSize: "12px",
                }}
              >
                (Optional)
              </span>
            </div>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) =>
                handleFileChange(setSupportingDocument, event)
              }
              disabled={isSubmitting}
            />

            {supportingDocument && (
              <div
                style={{
                  marginTop: "8px",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Selected: {supportingDocument.name}
              </div>
            )}
          </div>
        </div>

        {/* SUBMIT */}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: "100%",
            border: "none",
            borderRadius: "10px",
            padding: "14px 20px",
            background: isSubmitting ? "#94a3b8" : "#2563eb",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "700",
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting
            ? "Submitting Documents..."
            : "Submit Documents for Review"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: "16px",
            marginBottom: 0,
            color: "#94a3b8",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          Your documents will be securely submitted to SIMS Administration for
          review.
        </p>
      </div>
    </div>
  );
};

export default VerificationUpload;
