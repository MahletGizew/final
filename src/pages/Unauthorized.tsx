import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

const Unauthorized = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <Shield className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-foreground">
          {"Access Denied"}
        </h1>

        <p className="text-muted-foreground mb-6">
          <>
            You’ve reached a page that is restricted based on your current permissions.
            This could mean:
            <ul className="text-left mt-4 list-disc list-inside space-y-2">
              <li>You’re not signed in.</li>
              <li>Your account doesn’t have access to this section.</li>
              <li>You’re trying to access an admin- or teacher-only page.</li>
            </ul>
            <br />
            If you believe this is a mistake, please contact your administrator or support team.
          </>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default">
            <Link to="/home" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {"Go to Home"}
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link to="/auth" className="flex items-center">
              {"Sign Up / Log In"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
