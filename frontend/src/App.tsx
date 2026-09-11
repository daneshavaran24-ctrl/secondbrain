import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const KnowledgePage = lazy(() => import("./pages/KnowledgePage"));
const MeetingsPage = lazy(() => import("./pages/MeetingsPage"));
const MeetingPreparationPage = lazy(() => import("./pages/MeetingPreparationPage"));
const HealthPage = lazy(() => import("./pages/HealthPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const TrendsPage = lazy(() => import("./pages/TrendsPage"));
const SocialMediaPage = lazy(() => import("./pages/SocialMediaPage"));
const GadgetsPage = lazy(() => import("./pages/GadgetsPage"));
const PersonalJournalPage = lazy(() => import("./pages/PersonalJournalPage"));
const GratitudeJournalPage = lazy(() => import("./pages/GratitudeJournalPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const ProjectManagementPage = lazy(() => import("./pages/ProjectManagementPage"));
const PersonalProjectDashboardPage = lazy(() => import("./pages/PersonalProjectDashboardPage"));
const IdeasPage = lazy(() => import("./pages/IdeasPage"));
const DelegationPage = lazy(() => import("./pages/DelegationPage"));
const PersonalPlanningPage = lazy(() => import("./pages/PersonalPlanningPage"));
const ProfessionalPlanningPage = lazy(() => import("./pages/ProfessionalPlanningPage"));
const OrganizationalPlanningPage = lazy(() => import("./pages/OrganizationalPlanningPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const KhadimEKhalghPage = lazy(() => import("./pages/organizational/KhadimEKhalghPage"));
const Dashboard = lazy(() => import("./pages/organizational/khadim-e-khalgh/Dashboard"));
const Mission = lazy(() => import("./pages/organizational/khadim-e-khalgh/Mission"));
const Needs = lazy(() => import("./pages/organizational/khadim-e-khalgh/Needs"));
const Projects = lazy(() => import("./pages/organizational/khadim-e-khalgh/Projects"));
const Roadmap = lazy(() => import("./pages/organizational/khadim-e-khalgh/Roadmap"));
const Partners = lazy(() => import("./pages/organizational/khadim-e-khalgh/Partners"));
const VaridPage = lazy(() => import("./pages/organizational/VaridPage"));
const ChamberCommercePage = lazy(() => import("./pages/organizational/ChamberCommercePage"));
const FarangaranPage = lazy(() => import("./pages/organizational/FarangaranPage"));
const AssociationPage = lazy(() => import("./pages/organizational/AssociationPage"));
const PolicyMission = lazy(() => import("./components/organizational/PolicyMission"));
const MissionDashboard = lazy(() => import("./components/organizational/MissionDashboard"));
const SuccessionPlanning = lazy(() => import("./components/organizational/SuccessionPlanning"));
const ClaimsTracking = lazy(() => import("./components/organizational/ClaimsTracking").then(m => ({ default: m.ClaimsTracking })));
const MeetingMinutes = lazy(() => import("./components/organizational/MeetingMinutes"));
const EnhancedMeetingManager = lazy(() => import("./components/khadim-e-khalgh/EnhancedMeetingManager"));
const RiskAssessment = lazy(() => import("./components/organizational/RiskAssessment"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIChatPage = lazy(() => import("./pages/AIChatPage"));
const AIChatAnalytics = lazy(() => import("./pages/AIChatAnalytics"));
const SecretaryPortalPage = lazy(() => import("./pages/SecretaryPortalPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const CulturalContentPage = lazy(() => import("./pages/CulturalContentPage"));
const DocumentationPage = lazy(() => import("./pages/DocumentationPage"));
const UserManagementPage = lazy(() => import("./pages/UserManagementPage-simple"));
const CompaniesPage = lazy(() => import("./pages/CompaniesPage"));
const CompanyDetailPage = lazy(() => import("./pages/CompanyDetailPage"));
const CompanySettingsPage = lazy(() => import("./pages/CompanySettingsPage"));
const SocialResponsibilityPage = lazy(() => import("./pages/SocialResponsibilityPage"));
const CSRProjectDetailPage = lazy(() => import("./pages/CSRProjectDetailPage"));
const ResumePage = lazy(() => import("./pages/ResumePage"));
const PlaudCallbackPage = lazy(() => import("./pages/PlaudCallbackPage").then(m => ({ default: m.PlaudCallbackPage })));
const PlaudPage = lazy(() => import("./pages/PlaudPage").then(m => ({ default: m.PlaudPage })));
const HiDockPage = lazy(() => import("./pages/HiDockPage").then(m => ({ default: m.HiDockPage })));
const SubUsersManagementPage = lazy(() => import("./pages/SubUsersManagementPage"));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));
const AssistantReportsPage = lazy(() => import("./pages/AssistantReportsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const OrganizationDetailPage = lazy(() => import("./pages/OrganizationDetailPage"));
const OrganizationDashboardPage = lazy(() => import("./pages/OrganizationDashboardPage"));
const OrganizationSettingsPage = lazy(() => import("./pages/OrganizationSettingsPage"));
const OrganizationMembersPage = lazy(() => import("./pages/OrganizationMembersPage"));
const AcceptInvitationPage = lazy(() => import("./pages/AcceptInvitationPage"));
const CreateOrganizationPage = lazy(() => import("./pages/CreateOrganizationPage"));
const OrganizationAdvancedDashboardPage = lazy(() => import("./pages/OrganizationAdvancedDashboardPage"));
const MyOrganizationsPage = lazy(() => import("./pages/MyOrganizationsPage"));
const HabitTrackerPage = lazy(() => import("./pages/HabitTrackerPage"));
const BusinessEmailPage = lazy(() => import("./pages/BusinessEmailPage"));
const PersonalContactsPage = lazy(() => import("./pages/PersonalContactsPage"));

// Debug components - only in development
const DebugPanel = lazy(() => import("./components/debug/DebugPanel"));
const QuickCleanupButton = lazy(() => import("./components/debug/QuickCleanupButton").then(m => ({ default: m.QuickCleanupButton })));

const isDevelopment = import.meta.env.DEV;

// بهبود تنظیمات QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 دقیقه
      gcTime: 10 * 60 * 1000, // 10 دقیقه (جایگزین cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online'
    },
    mutations: {
      retry: 1,
      networkMode: 'online'
    }
  }
});

const App = () => {
  // فاز 2: Cache Cleanup - پاکسازی cache قدیمی
  React.useEffect(() => {
    const cacheVersion = localStorage.getItem('cache_version');
    if (cacheVersion !== 'v2') {
      // پاک کردن cache های قدیمی
      localStorage.removeItem('main_organization');
      localStorage.setItem('cache_version', 'v2');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {isDevelopment && (
            <Suspense fallback={null}>
              <DebugPanel />
            </Suspense>
          )}
          <BrowserRouter>
            <Suspense fallback={<PageLoadingSkeleton />}>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/signup" element={<SignupPage />} />
                <Route path="/" element={<Index />}>
                  <Route path="knowledge" element={<KnowledgePage />} />
                  <Route path="meetings" element={<MeetingsPage />} />
                  <Route path="meetings/preparation" element={<MeetingPreparationPage />} />
                  <Route path="health" element={<HealthPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="trends" element={<TrendsPage />} />
                  <Route path="social-media" element={<SocialMediaPage />} />
                  <Route path="gadgets" element={<GadgetsPage />} />
                  <Route path="personal-journal" element={<PersonalJournalPage />} />
                  <Route path="gratitude-journal" element={<GratitudeJournalPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="legal" element={<LegalPage />} />
                  <Route path="projects" element={<ProjectManagementPage />} />
                  <Route path="personal-dashboard" element={<PersonalProjectDashboardPage />} />
                  <Route path="ideas" element={<IdeasPage />} />
                  <Route path="delegation" element={<DelegationPage />} />
                  <Route path="personal-planning" element={<PersonalPlanningPage />} />
                  <Route path="professional-planning" element={<ProfessionalPlanningPage />} />
                  <Route path="organizational-planning" element={<OrganizationalPlanningPage />} />
                  <Route path="ai-chat" element={<AIChatPage />} />
                  <Route path="ai-chat/analytics" element={<AIChatAnalytics />} />
                  <Route path="secretary-portal" element={<SecretaryPortalPage />} />
                  <Route path="cultural-content" element={<CulturalContentPage />} />
                  <Route path="documentation" element={<DocumentationPage />} />
                  <Route path="companies" element={<CompaniesPage />} />
                  <Route path="social-responsibility" element={<SocialResponsibilityPage />} />
                  <Route path="csr-project/:id" element={<CSRProjectDetailPage />} />
                  <Route path="resume" element={<ResumePage />} />
                  <Route path="plaud" element={<PlaudPage />} />
                  <Route path="plaud/callback" element={<PlaudCallbackPage />} />
                  <Route path="hi-dock" element={<HiDockPage />} />
                  <Route path="habits" element={<HabitTrackerPage />} />
                  <Route path="business-email" element={<BusinessEmailPage />} />
                  <Route path="contacts" element={<PersonalContactsPage />} />
                  <Route path="assistant-reports" element={<AssistantReportsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="my-organizations" element={<MyOrganizationsPage />} />
                  
                  {/* Debug/Cleanup Route */}
                  {isDevelopment && (
                    <Route path="debug/cleanup" element={
                      <div className="min-h-screen bg-background flex items-center justify-center p-4">
                        <QuickCleanupButton />
                      </div>
                    } />
                  )}
                  
                  {/* Admin Routes */}
                  <Route path="admin" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPage />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/users" element={
                    <ProtectedRoute requiredRole="admin">
                      <UserManagementPage />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/sub-users" element={<SubUsersManagementPage />} />
                  <Route path="admin/audit-logs" element={<AuditLogsPage />} />
                  <Route path="organization/:organizationId" element={<OrganizationDetailPage />} />
                  <Route path="organization/:organizationId/settings" element={<OrganizationSettingsPage />} />
                  <Route path="organization/:organizationId/dashboard" element={<OrganizationDashboardPage />} />
                  <Route path="organizations/:organizationId" element={<OrganizationDetailPage />} />
                  <Route path="organizations/:organizationId/settings" element={<OrganizationSettingsPage />} />
                  <Route path="organizations/:organizationId/dashboard" element={<OrganizationAdvancedDashboardPage />} />
                  <Route path="organizations/:organizationId/members" element={<OrganizationMembersPage />} />
                  <Route path="organizations/new" element={<CreateOrganizationPage />} />
                  <Route path="accept-invitation/:token" element={<AcceptInvitationPage />} />
                  <Route path="organizational/khadim-e-khalgh" element={<KhadimEKhalghPage />} />
                  <Route path="organizational/khadim-e-khalgh/dashboard" element={<Dashboard />} />
                  <Route path="organizational/khadim-e-khalgh/mission" element={<Mission />} />
                  <Route path="organizational/khadim-e-khalgh/needs" element={<Needs />} />
                  <Route path="organizational/khadim-e-khalgh/projects" element={<Projects />} />
                  <Route path="organizational/khadim-e-khalgh/roadmap" element={<Roadmap />} />
                  <Route path="organizational/khadim-e-khalgh/partners" element={<Partners />} />
                  <Route path="organizational/khadim-e-khalgh/meeting-minutes" element={<EnhancedMeetingManager />} />

                  {/* Varid Health Organization */}
                  <Route path="organizations/varid" element={<VaridPage />} />
                  <Route path="organizations/varid/policy-mission" element={<PolicyMission organizationName="ورید هلث" />} />
                  <Route path="organizations/varid/mission-dashboard" element={<MissionDashboard organizationName="ورید هلث" />} />
                  <Route path="organizations/varid/succession" element={<SuccessionPlanning organizationName="ورید هلث" />} />
                  <Route path="organizations/varid/claims-tracking" element={<ClaimsTracking organizationName="ورید هلث" />} />
                  <Route path="organizations/varid/meeting-minutes" element={<MeetingMinutes organizationName="ورید هلث" />} />
                  <Route path="organizations/varid/risk-assessment" element={<RiskAssessment organizationName="ورید هلث" />} />

                  {/* Chamber of Commerce */}
                  <Route path="organizations/chamber" element={<ChamberCommercePage />} />
                  <Route path="organizations/chamber/policy-mission" element={<PolicyMission organizationName="اتاق بازرگانی" />} />
                  <Route path="organizations/chamber/mission-dashboard" element={<MissionDashboard organizationName="اتاق بازرگانی" />} />
                  <Route path="organizations/chamber/succession" element={<SuccessionPlanning organizationName="اتاق بازرگانی" />} />
                  <Route path="organizations/chamber/claims-tracking" element={<ClaimsTracking organizationName="اتاق بازرگانی" />} />
                  <Route path="organizations/chamber/meeting-minutes" element={<MeetingMinutes organizationName="اتاق بازرگانی" />} />
                  <Route path="organizations/chamber/risk-assessment" element={<RiskAssessment organizationName="اتاق بازرگانی" />} />

                  {/* Farangaran */}
                  <Route path="organizations/frangaran" element={<FarangaranPage />} />
                  <Route path="organizations/frangaran/policy-mission" element={<PolicyMission organizationName="فرانگران" />} />
                  <Route path="organizations/frangaran/mission-dashboard" element={<MissionDashboard organizationName="فرانگران" />} />
                  <Route path="organizations/frangaran/succession" element={<SuccessionPlanning organizationName="فرانگران" />} />
                  <Route path="organizations/frangaran/claims-tracking" element={<ClaimsTracking organizationName="فرانگران" />} />
                  <Route path="organizations/frangaran/meeting-minutes" element={<MeetingMinutes organizationName="فرانگران" />} />
                  <Route path="organizations/frangaran/risk-assessment" element={<RiskAssessment organizationName="فرانگران" />} />

                  {/* Association */}
                  <Route path="organizations/association" element={<AssociationPage />} />
                  <Route path="organizations/association/policy-mission" element={<PolicyMission organizationName="انجمن تولیدکنندگان" />} />
                  <Route path="organizations/association/mission-dashboard" element={<MissionDashboard organizationName="انجمن تولیدکنندگان" />} />
                  <Route path="organizations/association/succession" element={<SuccessionPlanning organizationName="انجمن تولیدکنندگان" />} />
                  <Route path="organizations/association/claims-tracking" element={<ClaimsTracking organizationName="انجمن تولیدکنندگان" />} />
                  <Route path="organizations/association/meeting-minutes" element={<MeetingMinutes organizationName="انجمن تولیدکنندگان" />} />
                  <Route path="organizations/association/risk-assessment" element={<RiskAssessment organizationName="انجمن تولیدکنندگان" />} />
                  
                  {/* Company Detail Pages */}
                  <Route path="company/:companyId" element={<CompanyDetailPage />} />
                  <Route path="company/:companyId/settings" element={<CompanySettingsPage />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
