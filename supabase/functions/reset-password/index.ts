import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders, securityHeaders } from '../_shared/cors.ts';

// Zod schema for input validation
const resetPasswordSchema = z.object({
    userId: z.string().uuid('فرمت شناسه کاربر نامعتبر است'),
    newPassword: z.string()
        .min(8, 'رمز عبور باید حداقل 8 کاراکتر باشد')
        .max(100, 'رمز عبور نباید بیشتر از 100 کاراکتر باشد')
        .regex(/[A-Za-z]/, 'رمز عبور باید حداقل یک حرف داشته باشد')
        .regex(/[0-9]/, 'رمز عبور باید حداقل یک عدد داشته باشد'),
});

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Create a Supabase client with the Auth context of the function
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
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
                JSON.stringify({ error: "Only administrators can reset passwords" }),
                { status: 403, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get request body and validate with Zod
        const body = await req.json();
        const validationResult = resetPasswordSchema.safeParse(body);

        if (!validationResult.success) {
            console.error('Validation error:', validationResult.error.errors);
            const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
            return new Response(
                JSON.stringify({ error: errorMessage }),
                { status: 400, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
            );
        }

        const { userId, newPassword } = validationResult.data;

        // Get admin service role key from environment variable
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!serviceRoleKey) {
            return new Response(
                JSON.stringify({ error: "Service role key not configured" }),
                { status: 500, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create a Supabase client with service role key
        const adminClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            serviceRoleKey
        );

        // Update the user's password
        const { error } = await adminClient.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (error) {
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
            );
        }

        // Log the password reset for audit purposes using the correct auth_audit table
        try {
            await supabaseClient.from("auth_audit").insert({
                actor_id: user.id,
                actor_type: 'admin',
                action: 'password_reset',
                details: {
                    target_user: userId,
                    reset_by: user.email || user.id
                },
                ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
                user_agent: req.headers.get('user-agent') || null
            });
            console.log('Audit log created for password reset');
        } catch (auditError) {
            // Log audit failure but don't fail the password reset
            console.error('Failed to create audit log:', auditError);
        }

        return new Response(
            JSON.stringify({ success: true, message: "Password reset successful" }),
            { status: 200, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error resetting password:", error);
        return new Response(
            JSON.stringify({ error: "An unexpected error occurred" }),
            { status: 500, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
        );
    }
});
