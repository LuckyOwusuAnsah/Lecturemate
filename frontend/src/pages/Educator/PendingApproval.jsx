import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, XCircle, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PendingApproval() {
  const { user, isAuthenticated, isOnboardingComplete, loading: authLoading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/Login", { replace: true });
      return;
    }
    if (user?.role !== "educator") {
      navigate("/Home", { replace: true });
      return;
    }
    if (!isOnboardingComplete) {
      navigate("/EducatorOnboarding", { replace: true });
      return;
    }
    if (user?.status === "approved") {
      navigate("/EducatorDashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, isOnboardingComplete, user, navigate]);

  const handleCheckStatus = async () => {
    setChecking(true);
    const result = await refreshUser();
    setChecking(false);

    if (result.success && result.user?.status === "approved") {
      toast.success("Your account has been approved!");
      navigate("/EducatorDashboard", { replace: true });
    } else if (result.success && result.user?.status === "rejected") {
      toast.info("Your application status has been updated.");
    } else {
      toast.info("Still pending review. Please check back later.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/Login");
  };

  const isRejected = user?.status === "rejected";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg text-center shadow-xl rounded-3xl">
        <CardHeader>
          <div
            className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
              isRejected
                ? "bg-red-100 dark:bg-red-900"
                : "bg-amber-100 dark:bg-amber-900"
            }`}
          >
            {isRejected ? (
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-300" />
            ) : (
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-300" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRejected ? "Application Not Approved" : "Application Submitted"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isRejected ? (
            <p className="text-gray-600 dark:text-gray-300">
              Your educator application was not approved. If you believe this
              is a mistake, please contact support for more information.
            </p>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-300">
                Thanks for completing your educator onboarding,{" "}
                <span className="font-medium">{user?.name}</span>. Your
                application is now{" "}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  pending admin approval
                </span>
                .
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                An administrator will review the details you submitted
                (expertise, institution, and credentials) before your account
                is granted full access to create and publish courses. This
                usually doesn&rsquo;t take long &mdash; you can check back
                here at any time.
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {!isRejected && (
              <Button onClick={handleCheckStatus} disabled={checking}>
                <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Checking..." : "Check Approval Status"}
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
