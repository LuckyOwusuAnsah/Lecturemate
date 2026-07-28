import { useState } from "react";
import { toast } from "react-toastify";
import { forgotPassword } from "@/api/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AtSign } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email });
    } catch (err) {
      // The backend always returns a generic success message, even if the
      // email doesn't exist, so this only fires on real network/server errors.
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
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
            Forgot your password?
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Enter your email and we'll send you a link to reset it
          </p>
        </CardHeader>

        {submitted ? (
          <CardContent className="space-y-4 pb-8 text-center">
            <div className="bg-green-100 text-green-700 text-sm rounded-md px-4 py-3 border border-green-300">
              If an account with that email exists, a reset link has been sent.
              The link expires in 10 minutes.
            </div>
            <a href="/Login" className="text-sm hover:underline block">
              Back to sign in
            </a>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pb-8">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>

              <div className="text-sm text-gray-500 mt-4 text-center">
                <a href="/Login" className="hover:underline">
                  Back to sign in
                </a>
              </div>
            </CardContent>
          </form>
        )}
      </Card>
    </div>
  );
}
