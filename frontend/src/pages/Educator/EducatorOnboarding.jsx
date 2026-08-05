"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  User,
  Calendar,
  Video,
  MessageCircleQuestion,
  Upload,
  Loader2,
} from "lucide-react";

import { completeEducatorOnboarding } from "@/api/educator";
import { completeOnboardingAPI } from "@/api/auth.js";
import { useAuth } from "@/context/AuthContext.jsx";


const steps = [
  { label: "Profile", icon: <User className="w-5 h-5" /> },
  { label: "Preferences", icon: <Calendar className="w-5 h-5" /> },
  { label: "Teaching Tools", icon: <Video className="w-5 h-5" /> },
  { label: "Vision", icon: <MessageCircleQuestion className="w-5 h-5" /> },
  { label: "Verification", icon: <Upload className="w-5 h-5" /> },
];

export default function EducatorOnboarding() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    expertise: "",
    institution: "",
    experience: "",
    teachingMode: "",
    availability: "",
    groupSize: "",
    platforms: [],
    sampleLink: "",
    hasDigitalExperience: false,
    motivation: "",
    subjects: "",
    valueProposition: "",
    credentialsText: "",
    agreeTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user, isAuthenticated, isOnboardingComplete, loading: authLoading, updateUserOnboardingStatus } = useAuth();


  // Redirect logic based on authentication and onboarding status
  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth state to resolve
    }

    if (!isAuthenticated) {
      toast.info("Please log in to complete onboarding.");
      navigate("/Login");
      return;
    }

    if (user && user.role === 'educator') {
      if (isOnboardingComplete) {
        toast.info("Onboarding already completed.");
        navigate(user.status === "approved" ? "/EducatorDashboard" : "/PendingApproval");
        return;
      }
    } else if (user && user.role !== 'educator') {
      toast.warn("You do not have access to educator onboarding.");
      navigate("/Home");
    }
  }, [isAuthenticated, isOnboardingComplete, user, authLoading, navigate]);


  const handleChange = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCheckboxChange = useCallback((key, value) => {
    setFormData((prev) => {
      const currentArray = prev[key] || [];
      if (currentArray.includes(value)) {
        return { ...prev, [key]: currentArray.filter((v) => v !== value) };
      } else {
        return { ...prev, [key]: [...currentArray, value] };
      }
    });
  }, []);

  const handleNext = useCallback(() => {
    let isValid = true;
    if (step === 0) {
      if (!formData.expertise || !formData.institution || !formData.experience) {
        toast.error("Please fill in all profile details.");
        isValid = false;
      }
    } else if (step === 1) {
      if (!formData.teachingMode || !formData.availability || !formData.groupSize) {
        toast.error("Please select all preferences.");
        isValid = false;
      }
    }
    else if (step === 3) {
      if (!formData.motivation || !formData.subjects || !formData.valueProposition) {
        toast.error("Please fill in all vision details.");
        isValid = false;
      }
    }

    if (isValid && step < steps.length - 1) {
      setStep((prev) => prev + 1);
    }
  }, [step, formData]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    // Final validation for the last step
    if (!formData.motivation || !formData.subjects || !formData.valueProposition) {
      toast.error("Please fill in all vision details.");
      return;
    }
    if (!formData.credentialsText) {
      toast.error("Please provide your credentials text or link.");
      return;
    }
    if (!formData.agreeTerms) {
      toast.error("You must agree to the terms and conditions.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      for (const key in formData) {
        let actualKey = key;
        let actualValue = formData[key];

        if (key === "credentialsText") {
            actualKey = "credentialsFile";
        }

        if (actualValue !== null && actualValue !== undefined) {
          if (Array.isArray(actualValue)) {
            actualValue.forEach(item => {
              payload.append(actualKey, item);
            });
          } else if (typeof actualValue === 'boolean') {
            payload.append(actualKey, actualValue ? "true" : "false");
          } else {
            payload.append(actualKey, actualValue);
          }
        }
      }

      // 1. Submit educator-specific profile data
      await completeEducatorOnboarding(payload);

      // 2. Mark general user onboarding as complete in the AuthContext and on the User model in backend
      const updateResult = await updateUserOnboardingStatus();
      if (!updateResult.success) {
        throw new Error(updateResult.message || "Failed to update general onboarding status.");
      }

      toast.success("Application submitted! Your account is now pending admin approval.");
      navigate("/PendingApproval");
    } catch (err) {
      console.error("Educator onboarding submission error:", err);
      toast.error(
        err?.response?.data?.message || "Submission failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, navigate, updateUserOnboardingStatus]);

  // Render nothing if auth is loading, or if conditions for redirect are met
  if (authLoading || (!isAuthenticated && !authLoading) || (user && user.role === 'educator' && isOnboardingComplete)) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-3xl p-6 md:p-10 rounded-3xl shadow-2xl bg-white dark:bg-gray-900">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold text-gray-800 dark:text-white">
            Educator Onboarding
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Fill out this short form to apply as an educator on LectureMate.
          </p>
        </CardHeader>

        {/* Step Tracker*/}
        <div className="flex justify-between px-6 mb-8 relative">
          {steps.map((s, index) => (
            <div
              key={s.label}
              className="flex flex-col items-center text-sm font-medium relative z-10"
            >
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  index === step
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : index < step
                    ? "bg-green-500 text-white border-green-500"
                    : "text-gray-500 border-gray-300"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`mt-2 text-xs ${
                  index <= step ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
          <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-300 dark:bg-gray-700 z-0">
            <div
              className="h-0.5 bg-indigo-500 transition-all duration-500"
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <CardContent className="space-y-6 px-4 md:px-8">
          {/* Form steps*/}
          {step === 0 && (
            <>
              <Input
                placeholder="Area of Expertise"
                value={formData.expertise}
                onChange={(e) => handleChange("expertise", e.target.value)}
                required
              />
              <Input
                placeholder="Institution"
                value={formData.institution}
                onChange={(e) => handleChange("institution", e.target.value)}
                required
              />
              <Select
                value={formData.experience}
                onValueChange={(val) => handleChange("experience", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Years of Experience" />
                </SelectTrigger>
                <SelectContent>
                  {["<1", "1-3", "3-5", "5+"].map((exp) => (
                    <SelectItem key={exp} value={exp}>
                      {exp} years
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {step === 1 && (
            <>
              <Select
                value={formData.teachingMode}
                onValueChange={(val) => handleChange("teachingMode", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Preferred Mode" />
                </SelectTrigger>
                <SelectContent>
                  {["Online", "In-person", "Hybrid"].map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={formData.availability}
                onValueChange={(val) => handleChange("availability", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Available Time Slot" />
                </SelectTrigger>
                <SelectContent>
                  {["Morning", "Afternoon", "Evening", "Flexible"].map(
                    (slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Select
                value={formData.groupSize}
                onValueChange={(val) => handleChange("groupSize", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Group Size" />
                </SelectTrigger>
                <SelectContent>
                  {["1-5", "6-15", "15+"].map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} students
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {step === 2 && (
            <>
              <label className="text-sm font-medium">Platforms</label>
              <div className="grid grid-cols-2 gap-3">
                {["Zoom", "Google Meet", "LMS", "Blackboard"].map(
                  (platform) => (
                    <label
                      key={platform}
                      htmlFor={`platform-${platform}`}
                      className="flex gap-2 items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id={`platform-${platform}`}
                        checked={formData.platforms.includes(platform)}
                        onChange={() =>
                          handleCheckboxChange("platforms", platform)
                        }
                      />
                      <span>{platform}</span>
                    </label>
                  )
                )}
              </div>
              <Input
                placeholder="Sample Content Link (e.g., YouTube, Google Drive)"
                value={formData.sampleLink}
                onChange={(e) => handleChange("sampleLink", e.target.value)}
                type="url"
              />
              <div className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  id="hasDigitalExperience"
                  checked={formData.hasDigitalExperience}
                  onChange={() =>
                    handleChange("hasDigitalExperience", !formData.hasDigitalExperience)
                  }
                />
                <label htmlFor="hasDigitalExperience" className="text-sm cursor-pointer">
                  I have experience creating digital content
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Input
                placeholder="Why do you want to teach? (Your motivation)"
                value={formData.motivation}
                onChange={(e) => handleChange("motivation", e.target.value)}
                required
              />
              <Input
                placeholder="Subjects you plan to teach (e.g., Math, Physics, English)"
                value={formData.subjects}
                onChange={(e) => handleChange("subjects", e.target.value)}
                required
              />
              <Input
                placeholder="What unique value do you bring as an educator?"
                value={formData.valueProposition}
                onChange={(e) => handleChange("valueProposition", e.target.value)}
                required
              />
            </>
          )}

          {step === 4 && (
            <>
              <label htmlFor="credentialsText" className="text-sm font-medium">
                Upload Credentials (e.g., Certificates, Resume)
              </label>
              <Input
                id="credentialsText"
                type="text"
                placeholder="Enter link to credentials or relevant text"
                value={formData.credentialsText}
                onChange={(e) => handleChange("credentialsText", e.target.value)}
                required
              />

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={() => handleChange("agreeTerms", !formData.agreeTerms)}
                  required
                />
                <label htmlFor="agreeTerms" className="text-sm cursor-pointer">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    terms and conditions
                  </a>
                </label>
              </div>
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={handlePrev} disabled={step === 0}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={handleNext}>Continue</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting || !formData.agreeTerms}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}