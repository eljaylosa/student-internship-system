import React, { useEffect, useState } from "react";
import { supabaseRegistrar } from "../../supabaseClient";

const BUCKET = "school-assets";

export default function SchoolLogo() {
  const [school, setSchool] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSchool();
  }, []);

  const loadSchool = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabaseRegistrar.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("You are not authenticated.");
      }

      // Get registrar's school
      const { data: registrar, error: registrarError } = await supabaseRegistrar
        .from("registrars")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (registrarError) throw registrarError;

      if (!registrar?.school_id) {
        throw new Error("Your registrar account is not assigned to a school.");
      }

      setSchoolId(registrar.school_id);

      // Get school information
      const { data: schoolData, error: schoolError } = await supabaseRegistrar
        .from("schools")
        .select("id, name, code, logo_url")
        .eq("id", registrar.school_id)
        .single();

      if (schoolError) throw schoolError;

      setSchool(schoolData);
    } catch (err) {
      console.error("Load school error:", err);
      setError(err.message || "Failed to load school information.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");

    // Only image files
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo must be 5MB or smaller.");
      return;
    }

    if (!schoolId) {
      setError("School information is not available.");
      return;
    }

    try {
      setUploading(true);

      const extension = file.name.split(".").pop()?.toLowerCase() || "png";

      /*
       * IMPORTANT:
       *
       * We use a unique filename instead of replacing the old logo.
       *
       * This is intentional because old certificates may reference
       * the previous school logo.
       */
      const filePath = `school-logos/${schoolId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabaseRegistrar.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseRegistrar.storage.from(BUCKET).getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error("Failed to generate public logo URL.");
      }

      // Save URL to schools table
      const { error: updateError } = await supabaseRegistrar
        .from("schools")
        .update({
          logo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", schoolId);

      if (updateError) throw updateError;

      setSchool((prev) => ({
        ...prev,
        logo_url: publicUrl,
      }));

      setMessage("School logo uploaded successfully.");
    } catch (err) {
      console.error("Logo upload error:", err);
      setError(err.message || "Failed to upload school logo.");
    } finally {
      setUploading(false);

      // Allow selecting the same file again
      event.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-gray-500">Loading school information...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">School Logo</h2>

        <p className="text-sm text-gray-500 mt-1">
          Upload your school's official logo. This logo will be used
          automatically on internship completion certificates.
        </p>
      </div>

      {school && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700">School</p>

          <p className="text-gray-900 font-semibold">{school.name}</p>

          {school.code && (
            <p className="text-sm text-gray-500">{school.code}</p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Current logo */}
        <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
          {school?.logo_url ? (
            <img
              src={school.logo_url}
              alt={`${school.name} logo`}
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <div className="text-center px-4">
              <p className="text-sm text-gray-400">No logo uploaded</p>
            </div>
          )}
        </div>

        {/* Upload */}
        <div>
          <label
            className={`inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold cursor-pointer transition ${
              uploading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {uploading ? "Uploading..." : "Upload School Logo"}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <p className="text-xs text-gray-500 mt-3">
            PNG, JPG, or WebP · Maximum 5MB
          </p>

          {message && <p className="text-sm text-green-600 mt-3">{message}</p>}

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
}
