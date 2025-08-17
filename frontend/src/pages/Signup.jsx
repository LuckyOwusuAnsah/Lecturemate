import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AtSign, Lock, User, Users } from "lucide-react";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const [showError, setShowError] = useState(true);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast.error("Please fill all fields");
      return;
    }

    const result = await register(formData);

    if (result.success) {
      toast.success("Account created successfully!");

      const loggedInUser = result.user;

      // === CRITICAL FIX FOR RACE CONDITION ===
      // Introduce a small delay to allow the browser to properly set the cookie
      // and for AuthContext's isAuthenticated state to fully propagate.
      setTimeout(() => {
        const userRole = loggedInUser?.role || 'student';
        const onboardingStatus = loggedInUser?.onboardingCompleted;

        if (onboardingStatus === false) {
          if (userRole === "student") {
            navigate("/StudentOnboarding");
          } else if (userRole === "educator") {
            navigate("/EducatorOnboarding");
          } else if (userRole === "admin") {
            navigate("/AdminPanel");
          } else {
            navigate("/Home");
          }
        } else {
          if (userRole === "student") {
            navigate("/StudentDashboard");
          } else if (userRole === "educator") {
            navigate("/EducatorDashboard");
          } else {
            navigate("/Home");
          }
        }
      }, 50); // 50ms delay (adjust if needed)
      // =====================================

    } else {
      setShowError(true);
      toast.error(error || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-[90%] max-w-md shadow-xl rounded-2xl">
        <CardHeader className="flex flex-col items-center gap-4 pt-8">
          <img
            src="/logo/owl.png"
            alt="Logo"
            className="w-16 h-16 rounded-full border p-1 bg-white"
          />
          <CardTitle className="text-2xl font-bold text-center">
            Create an account
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Join LectureMate today
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pb-8">
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 text-gray-400" size={16} />
                <select
                  id="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="pl-10 pr-4 py-2 border rounded-md w-full text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="">Select Role</option>
                  <option value="student">Student</option>
                  <option value="educator">Educator</option>
                </select>
              </div>
            </div>

            {error && showError && (
              <div className="bg-red-100 text-red-700 text-sm rounded-md px-4 py-2 text-center border border-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>

            <div className="text-sm text-gray-500 mt-4 text-center">
              Already have an account?{" "}
              <a href="/login" className="hover:underline">
                Sign in
              </a>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
