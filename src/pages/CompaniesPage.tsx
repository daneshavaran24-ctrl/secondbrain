import { CompaniesManager } from "@/components/user-management/CompaniesManager";

export default function CompaniesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            مدیریت شرکت‌ها و کسب‌وکارها
          </h1>
          <p className="text-muted-foreground">
            شرکت‌ها و کسب‌وکارهای شخصی خود را مدیریت کنید
          </p>
        </div>
        
        <CompaniesManager />
      </div>
    </div>
  );
}
