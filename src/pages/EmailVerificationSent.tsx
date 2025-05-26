import React from "react";
import { Link } from "react-router-dom";
import { MailCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

const EmailVerificationSent = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
            <MailCheck className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-foreground">
          {t ? t("Verification Email Sent") : "Verification Email Sent"}
        </h1>

        <p className="text-muted-foreground mb-6">
          {t
            ? t(
                "A verification email has been sent to your email address. Please check your inbox and follow the instructions to verify your account."
              )
            : "A verification email has been sent to your email address. Please check your inbox and follow the instructions to verify your account."}
        </p>

        <p className="text-muted-foreground mb-6">
          {t
            ? t(
                "If you do not receive the email within a few minutes, please check your spam folder or request a new verification email."
              )
            : "If you do not receive the email within a few minutes, please check your spam folder or request a new verification email."}
        </p>

        <div className="flex justify-center">
          <Button asChild variant="default">
            <Link to="/auth" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t ? t("Sign in") : "Sign in"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationSent;
