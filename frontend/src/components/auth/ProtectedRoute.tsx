import { ReactNode, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import { SystemRole } from "@/types/user-management";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: SystemRole;
}

export function ProtectedRoute({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout>();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    const checkAccess = () => {
      console.log('🔍 ProtectedRoute - بررسی دسترسی:', { 
        isLoading, 
        isAuthenticated, 
        hasUser: !!user, 
        role,
        requiredRole 
      });

      // پاکسازی timeout قبلی
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      // اگر در حال بارگذاری است، timeout تنظیم کن
      if (isLoading) {
        checkTimeoutRef.current = setTimeout(() => {
          console.warn('⚠️ ProtectedRoute - Timeout در بررسی احراز هویت');
          setAuthorized(false);
          if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            navigate("/auth", { replace: true });
          }
        }, 2000); // کاهش timeout به 2 ثانیه
        
        setAuthorized(null); // در حال انتظار
        return;
      }

      // پاکسازی timeout
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = undefined;
      }

      // اگر احراز هویت نشده، به صفحه ورود هدایت کن
      if (!isAuthenticated || !user) {
        console.log('❌ ProtectedRoute - کاربر احراز هویت نشده');
        setAuthorized(false);
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          navigate("/auth", { replace: true });
        }
        return;
      }

      // بررسی نقش مورد نیاز
      if (requiredRole) {
        // اگر نقش مورد نیاز admin است و کاربر admin نیست
        if (requiredRole === 'admin' && role !== 'admin') {
          console.log('❌ ProtectedRoute - دسترسی admin مورد نیاز');
          setAuthorized(false);
          if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            navigate("/", { replace: true });
          }
          return;
        }

        // سایر بررسی‌های نقش
        const allowedRoles: SystemRole[] = [requiredRole];
        if (requiredRole === 'department_manager') {
          allowedRoles.push('admin', 'general_manager');
        } else if (requiredRole === 'user') {
          allowedRoles.push('admin', 'general_manager', 'department_manager');
        }

        if (!role || !allowedRoles.includes(role)) {
          console.log('❌ ProtectedRoute - نقش کافی نیست:', { role, allowedRoles });
          setAuthorized(false);
          if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            navigate("/", { replace: true });
          }
          return;
        }
      }

      // همه چیز OK است
      console.log('✅ ProtectedRoute - دسترسی تأیید شد');
      setAuthorized(true);
    };

    checkAccess();

    // پاکسازی timeout هنگام unmount
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user, role, isLoading, requiredRole, navigate]);

  // reset navigation flag when route changes
  useEffect(() => {
    hasNavigatedRef.current = false;
  }, []);

  // اگر در حال بارگذاری یا بررسی است
  if (isLoading || authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground">در حال بررسی دسترسی...</p>
          <p className="text-xs text-muted-foreground">
            Loading: {isLoading.toString()} | Auth: {authorized?.toString() ?? 'checking'}
          </p>
        </div>
      </div>
    );
  }

  // اگر مجوز ندارد
  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">عدم دسترسی به این بخش</p>
          <p className="text-muted-foreground">شما مجوز دسترسی به این بخش را ندارید</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
