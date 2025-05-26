import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

import AIAssistant from "@/pages/AIAssistant";
import AIAssistantDialog from "@/components/AIAssistant/AIAssistantDialog";
import AIAssistantButton from "@/components/AIAssistant/AIAssistantButton";
import { useEffect, useState } from "react";
import Home from "@/pages/Index";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Subjects from "@/pages/Subjects";
import Exam from "@/pages/Exam";
import TeacherConnect from "@/pages/TeacherConnect";
import Performance from "@/pages/Performance";
import Admin from "@/pages/Admin";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import QuestionBankExam from "./pages/Questionbank";
import SubjectResources from "./pages/SubjectResources";
import Unauthorized from "./pages/Unauthorized";
import AdminRoute from "./components/Auth/AdminRoute";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ApplyTeacher from "./pages/ApplyTeacher";
import TeacherRequestDetail from "./pages/TeacherRequestDetail";
import EmailVerificationSent from "./pages/EmailVerificationSent";

function App() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(true);

  useEffect(() => {
    const currentPath = window.location.pathname;
    // Hide floating button on AI assistant page since it would be redundant
    setShowFloatingButton(currentPath !== "/ai-assistant");

    const handleRouteChange = () => {
      const path = window.location.pathname;
      setShowFloatingButton(path !== "/ai-assistant");
    };

    // Setup listener for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    
      <LanguageProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
      <Router>
        <Routes>
  {/* Public Routes */}
  <Route path="/" element={<Home />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/verification" element={<EmailVerificationSent />} />

  {/* Protected Routes for All Authenticated Users */}
  <Route
    path="/profile"
    element={
      <ProtectedRoute >
        <Profile />
      </ProtectedRoute>
    }
  />
  <Route
    path="/subjects"
    element={
      <ProtectedRoute >
        <Subjects />
      </ProtectedRoute>
    }
  />
  <Route
    path="/subjects/:subjectId/resources"
    element={
      <ProtectedRoute >
        <SubjectResources />
      </ProtectedRoute>
    }
  />
  <Route
    path="/applyteacher"
    element={
      <ProtectedRoute >
        <ApplyTeacher/>
      </ProtectedRoute>
    }
  />
  <Route
    path="/subjects/:subjectId"
    element={
      <ProtectedRoute >
        <SubjectResources />
      </ProtectedRoute>
    }
  />
  <Route
    path="/exam"
    element={
      <ProtectedRoute>
        <Exam />
      </ProtectedRoute>
    }
  />
  <Route
    path="/teacher-connect"
    element={
      <ProtectedRoute>
        <TeacherConnect />
      </ProtectedRoute>
    }
  />
  <Route
    path="/performance"
    element={
      <ProtectedRoute>
        <Performance />
      </ProtectedRoute>
    }
  />
  <Route
    path="/questionBank"
    element={
      <ProtectedRoute>
        <QuestionBankExam />
      </ProtectedRoute>
    }
  />
  <Route
    path="/ai-assistant"
    element={
      <ProtectedRoute>
        <AIAssistant />
      </ProtectedRoute>
    }
  />

  {/* Admin Route */}
  <Route
    path="/admin"
    element={
      <AdminRoute>
        <Admin />
      </AdminRoute>
    }
  />
  <Route
  path="/admin/teacher-request/:id"
  element={
    <AdminRoute>
      <TeacherRequestDetail/>
    </AdminRoute>
  }
/>


  {/* Unauthorized Fallback */}
  <Route path="/unauthorized" element={<Unauthorized />} />

  {/* 404 Fallback */}
  <Route path="*" element={<NotFound/>} />
</Routes>

        {/* {showFloatingButton && (
          <AIAssistantButton onClick={() => setIsDialogOpen(true)} />
        )}
        <AIAssistantDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
        /> */}

<Toaster/>

      </Router>
      </AuthProvider>
    </ThemeProvider>
      </LanguageProvider>
   
  );
}

export default App;
