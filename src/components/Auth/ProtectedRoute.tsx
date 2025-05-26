// components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader } from "lucide-react"; // or your custom loader
import React from "react";

const ProtectedRoute = ({ children}: { children: React.ReactNode; }) => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-6 w-6 text-primary" />
        <span className="ml-2 text-muted-foreground">Checking access...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/unauthorized" replace />;


  return <>{children}</>;
};

export default ProtectedRoute;
