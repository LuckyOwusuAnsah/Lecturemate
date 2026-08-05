import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText } from "lucide-react";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h2>
    <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 space-y-3">
      {children}
    </div>
  </div>
);

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <ScrollText className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Terms and Conditions
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              LectureMate &mdash; Learning Management &amp; Wellness Platform
            </p>
          </CardHeader>

          <CardContent className="pb-10">
            <Section title="1. Acceptance of Terms">
              <p>
                By creating an account on LectureMate, you agree to be bound by
                these Terms and Conditions. If you do not agree with any part
                of these terms, you should not create an account or use the
                platform.
              </p>
            </Section>

            <Section title="2. Description of Service">
              <p>
                LectureMate is a learning management platform that combines
                course delivery, quizzes, and discussion tools for students
                and educators with AI-assisted features such as course
                content generation, automated quiz grading, and a wellness
                module that includes mood tracking and an AI counsellor chat.
              </p>
            </Section>

            <Section title="3. Accounts and Roles">
              <p>
                Users register as a Student, Educator, or Admin. Student
                accounts are active immediately after registration. Educator
                accounts are created with a &ldquo;pending&rdquo; status and
                are reviewed by an administrator, who verifies the
                information supplied during onboarding (expertise,
                institution, experience, and credentials) before granting full
                access to educator features such as publishing courses and
                quizzes.
              </p>
              <p>
                You are responsible for maintaining the confidentiality of
                your login credentials and for all activity that occurs under
                your account.
              </p>
            </Section>

            <Section title="4. Educator Content and Conduct">
              <p>
                Educators are responsible for the accuracy and appropriateness
                of the courses, lectures, and quizzes they publish, including
                any content drafted with the help of the AI content generator.
                AI-generated drafts must be reviewed by the educator before
                publishing; LectureMate does not guarantee the accuracy of
                AI-generated material.
              </p>
            </Section>

            <Section title="5. Wellness Features and Important Disclaimer">
              <p>
                The mood tracker, mindfulness resources, and AI counsellor
                chat are intended to support general well-being and are{" "}
                <strong>not a substitute for professional medical advice,
                diagnosis, or treatment</strong>. If you are in crisis or
                believe you may be a danger to yourself or others, please
                contact a qualified mental health professional or emergency
                services in your area immediately.
              </p>
              <p>
                A student&rsquo;s daily mood entries and free-text notes are
                private. Where an educator can see a wellness overview of
                their own enrolled students, this is limited to a mood
                category, weekly trend, and an automatically computed
                &ldquo;needs attention&rdquo; flag &mdash; a student&rsquo;s
                personal notes are never shared with educators or other
                students.
              </p>
            </Section>

            <Section title="6. Prohibited Conduct">
              <p>
                You may not use LectureMate to upload unlawful, harassing, or
                fraudulent content, attempt to gain unauthorized access to
                other accounts or data, or interfere with the normal operation
                of the platform.
              </p>
            </Section>

            <Section title="7. Termination">
              <p>
                LectureMate may suspend or terminate an account that violates
                these terms, including an educator account whose application
                is rejected or later found to contain false information.
              </p>
            </Section>

            <Section title="8. Limitation of Liability">
              <p>
                LectureMate is provided on an &ldquo;as is&rdquo; basis as an
                academic project. To the fullest extent permitted by law, the
                developers are not liable for any indirect or consequential
                loss arising from use of the platform.
              </p>
            </Section>

            <Section title="9. Changes to These Terms">
              <p>
                These terms may be updated from time to time. Continued use of
                LectureMate after changes are posted constitutes acceptance of
                the revised terms.
              </p>
            </Section>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
              <Link to="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
