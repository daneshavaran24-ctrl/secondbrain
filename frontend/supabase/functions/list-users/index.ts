// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, securityHeaders } from '../_shared/cors.ts';

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Create a Supabase client with the Auth context of the function
        const supabaseClient = createClient(
            // Supabase API URL - env var exported by default.
            process.env.SUPABASE_URL ?? "",
            // Supabase API ANON KEY - env var exported by default.
            process.env.SUPABASE_ANON_KEY ?? "",
            // Create client with Auth context of the user that called the function.
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        // Get the authorization header from the request
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
        return new Response(
            JSON.stringify({ error: "Authorization header is required" }),
            { status: 401, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
        );
        }

        // Check if the user is admin
        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            return new Response(
                JSON.stringify({ error: "No user found" }),
                { status: 401, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check if user has admin role
        const { data: userRoles } = await supabaseClient
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (!userRoles || userRoles.role !== "admin") {
            return new Response(
                JSON.stringify({ error: "Only administrators can list users" }),
                { status: 403, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get admin service role key from environment variable
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return new Response(
                JSON.stringify({ error: "Service role key not configured" }),
                { status: 500, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create a Supabase client with service role key
        const adminClient = createClient(
            process.env.SUPABASE_URL ?? "",
            serviceRoleKey
        );

        // Get the list of users from Supabase Auth
        const { data: users, error } = await adminClient.auth.admin.listUsers();

        if (error) {
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
            );
        }

        // Log the audit event
        await supabaseClient.from("audit_logs").insert({
            action: "list_users",
            performed_by: user.id,
            timestamp: new Date().toISOString(),
        });

        return new Response(
            JSON.stringify(users?.users || []),
            { status: 200, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Error listing users:", error);
        return new Response(
            JSON.stringify({ error: "An unexpected error occurred" }),
            { status: 500, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
        );
    }
});

// To invoke:
// curl -i --location --request GET 'http://localhost:54321/functions/v1/list-users' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
