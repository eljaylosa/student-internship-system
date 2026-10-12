import {
  supabaseStudent,
  supabaseRegistrar,
  supabaseCompany,
  supabase,
} from "../supabaseClient";

export default function getPortalSupabaseClient(pathname = "") {
  if (pathname.startsWith("/student")) {
    return supabaseStudent;
  }

  if (pathname.startsWith("/registrar")) {
    return supabaseRegistrar;
  }

  if (pathname.startsWith("/company")) {
    return supabaseCompany;
  }

  return supabase;
}
