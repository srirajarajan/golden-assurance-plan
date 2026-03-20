import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Loader2 } from "lucide-react";

// Lazy load pages for performance
const HomePage = lazy(() => import("@/pages/HomePage"));
const ApplicationPage = lazy(() => import("@/pages/ApplicationPage"));
const BenefitsPage = lazy(() => import("@/pages/BenefitsPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const UpdatesPage = lazy(() => import("@/pages/UpdatesPage"));
const DocumentationsPage = lazy(() => import("@/pages/DocumentationsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min cache
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/apply" element={<ApplicationPage />} />
                    <Route path="/benefits" element={<BenefitsPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/updates" element={<UpdatesPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <Footer />
              <WhatsAppButton />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
