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

          // Try to extract the actual Edge Function response
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

        {/* DOCUMENTS */}

        <div style={{ marginBottom: "28px" }}>
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "18px",
              color: "#0f172a",
            }}
          >
            Required Documents
          </h2>

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
              Business Permit
            </div>

            <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
          </div>

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
              Company Verification Document
            </div>

            <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
          </div>

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
              Authorized Representative ID
            </div>

            <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
          </div>
        </div>

        {/* SUBMIT */}

        <button
          type="button"
          disabled
          style={{
            width: "100%",
            border: "none",
            borderRadius: "10px",
            padding: "14px 20px",
            background: "#94a3b8",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "700",
            cursor: "not-allowed",
          }}
        >
          Submit Documents for Review
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
          Document submission will be enabled after the verification process is
          fully connected.
        </p>
      </div>
    </div>
  );
};

export default VerificationUpload;
