import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tdnkephmrsgacyvbtixn.supabase.co";
const supabaseKey = "sb_publishable_U9kaWTSyNs3HvybOeim49w_7eD5b0kR";

export const supabase = createClient(supabaseUrl, supabaseKey);