import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { organizationMemberService } from "@/services/organizationMemberService";
import { OrganizationInvitation } from "@/types/organization";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AcceptInvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (token && isAuthenticated) {
      loadInvitation();
    }
  }, [token, isAuthenticated]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
    }
  };

  const loadInvitation = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await organizationMemberService.getInvitationByToken(token);
      setInvitation(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    setProcessing(true);
    try {
      const success = await organizationMemberService.acceptInvitation(token);
      if (success && invitation) {
        navigate(`/organizations/${invitation.organization_id}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;

    setProcessing(true);
    try {
      await organizationMemberService.rejectInvitation(token);
      navigate('/profile');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              دعوتنامه نامعتبر
            </CardTitle>
            <CardDescription>
              این دعوتنامه معتبر نیست یا منقضی شده است
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/profile')} className="w-full">
              بازگشت به پروفایل
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>دعوت به سازمان</CardTitle>
          <CardDescription>
            شما به سازمان زیر دعوت شده‌اید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">
              {invitation.organizations?.name || 'نام سازمان'}
            </h2>
            {invitation.organizations?.description && (
              <p className="text-muted-foreground">
                {invitation.organizations.description}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={handleAccept}
              disabled={processing}
              size="lg"
            >
              {processing ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="ml-2 h-4 w-4" />
              )}
              پذیرش دعوت
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              variant="outline"
              size="lg"
            >
              رد دعوت
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
