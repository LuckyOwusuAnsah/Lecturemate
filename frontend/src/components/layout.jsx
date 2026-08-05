import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
// Corrected import paths from absolute aliases to relative paths to resolve compilation errors.
import { createPageUrl } from "@/utils";
import { useAuth } from "../context/AuthContext";

import { 
  BookOpen, 
  Home, 
  User, 
  Heart, 
  GraduationCap, 
  Sun, 
  Moon, 
  Menu,
  X,
  Crown,
  Users,
  BarChart3,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Define all possible navigation links. We will render them conditionally.

// Links for all authenticated users
const primaryNavigation = [
  { name: "Home", href: createPageUrl("Home"), icon: Home },
  { name: "Courses", href: createPageUrl("Courses"), icon: BookOpen },
];

// Links specific to admin
const adminNavigation = [
  { name: "Admin Panel", href: createPageUrl("AdminPanel"), icon: User },
];
// Links specific to students
const studentNavigation = [
  { name: "Dashboard", href: createPageUrl("StudentDashboard"), icon: User },
  { name: "Wellness", href: createPageUrl("Wellness"), icon: Heart },
  { name: "Messages", href: createPageUrl("Messages"), icon: MessageCircle },
];

// Links specific to educators
const educatorNavigation = [
  { name: "Dashboard", href: createPageUrl("EducatorDashboard"), icon: GraduationCap },
  { name: "Create Course", href: createPageUrl("CreateCourse"), icon: BookOpen },
  { name: "Analytics", href: createPageUrl("Analytics"), icon: BarChart3 },
  { name: "Student Wellness", href: createPageUrl("StudentWellness"), icon: Heart },
  { name: "AI Content", href: createPageUrl("AIContentGenerator"), icon: Sparkles },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  // Get user, isAuthenticated, and the login/logout functions from the AuthContext
  const { user, isAuthenticated, login, logout } = useAuth(); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const getNavigationLinks = () => {
    let links = [...primaryNavigation];
    if (user) {
      // Add user-specific links if authenticated
      if (user.role === "student") {
        links = [...links, ...studentNavigation];
      } else if (user.role === "educator") {
        links = [...links, ...educatorNavigation];
      }else if (user.role === "admin") {
        links = [...links, ...adminNavigation];
      } else{
        links = [...links, ...primaryNavigation];
      }
    }
    return links;
  };

  const navLinks = getNavigationLinks();

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <style>
        {`
          :root {
            --primary: #3B82F6;
            --primary-dark: #2563EB;
            --secondary: #8B5CF6;
            --success: #10B981;
            --warning: #F59E0B;
            --background: #FFFFFF;
            --surface: #F9FAFB;
            --text: #111827;
            --text-muted: #6B7280;
            --border: #E5E7EB;
          }
          
          .dark {
            --background: #111827;
            --surface: #1F2937;
            --text: #F9FAFB;
            --text-muted: #9CA3AF;
            --border: #374151;
          }
          
          * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
          }
        `}
      </style>
      
      <div className="min-h-screen bg-white dark:bg-gray-900" style={{ backgroundColor: "var(--background)" }}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link to={createPageUrl("Home")} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">LectureMate</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                {/* Render navigation based on user role */}
                {navLinks.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.href || location.pathname === item.href.split('?')[0]
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                ))}

              </nav>

              {/* Right side actions */}
              <div className="flex items-center gap-4">
                {user?.is_admin && (
                  <Link to={createPageUrl("AdminPanel")}>
                    <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}

                {/* Auth Button */}
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                      {user.full_name}
                    </span>
                    <Button variant="outline" size="sm" onClick={logout}>
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button size="sm">
                    <Link to={'/login'}>
                    Login
                    </Link>
                  </Button>
                )}

                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="w-9 h-9 p-0"
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </Button>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden w-9 h-9 p-0"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Menu className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 space-y-2">
                {navLinks.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                      location.pathname === item.href || location.pathname === item.href.split('?')[0]
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
                
                {user?.is_admin && (
                  <Link to={createPageUrl("AdminPanel")}>
                    <Button variant="outline" className="w-full justify-start gap-2 mt-2">
                      <Crown className="w-4 h-4" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
