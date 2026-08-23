// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = "https://tdnkephmrsgacyvbtixn.supabase.co";
// const supabaseKey = "sb_publishable_U9kaWTSyNs3HvybOeim49w_7eD5b0kR";

// export const supabase = createClient(supabaseUrl, supabaseKey);

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tdnkephmrsgacyvbtixn.supabase.co";
const supabaseKey = "sb_publishable_U9kaWTSyNs3HvybOeim49w_7eD5b0kR";

const createPortalClient = (storageKey) => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      storageKey,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

export const supabaseStudent = createPortalClient("sims-student-auth");

export const supabaseRegistrar = createPortalClient("sims-registrar-auth");

export const supabaseCompany = createPortalClient("sims-company-auth");

// Only keep this temporarily for pages that haven't been migrated.
export const supabase = createPortalClient("sims-default-auth");