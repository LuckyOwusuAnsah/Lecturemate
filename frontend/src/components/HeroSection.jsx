import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, Users, Award } from "lucide-react";

export default function HeroSection({ user, onAuthAction }) {
  return (
    <div className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Award className="w-4 h-4" />
              New courses added weekly
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Learn Without
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                Limits
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
              Master new skills with expert-led courses. From coding to creativity, 
              unlock your potential with our comprehensive learning platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
             {
  user ? (
    user.role === 'student' ? (
      <Link to={createPageUrl("StudentDashboard")}>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-xl">
          <BookOpen className="w-5 h-5 mr-2" />
          Go to Dashboard
        </Button>
      </Link>
    ) : user.role === 'educator' ? (
      <Link to={createPageUrl("EducatorDashboard")}>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-xl">
          <BookOpen className="w-5 h-5 mr-2" />
          Go to Dashboard
        </Button>
      </Link>
    ) : null // Or handle other user roles here if needed
  ) : (
    <Button 
      size="lg" 
      onClick={onAuthAction}
      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-xl"
    >
      <Play className="w-5 h-5 mr-2" />
      Start Learning
    </Button>
  )
}
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-3 text-lg rounded-xl"
              >
                <Users className="w-5 h-5 mr-2" />
                Browse Courses
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">50K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Students</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">1,200+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Courses</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">98%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Image Placeholder */}
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">React Masterclass</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">by Sarah Johnson</div>
                    </div>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32 mb-4 flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">12 chapters • 8.5 hours</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">$89</div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">2,400+</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Students</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Certificate</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Included</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}