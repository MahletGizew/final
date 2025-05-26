import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [signInPasswordVisible, setSignInPasswordVisible] = useState(false);
  const [signUpPasswordVisible, setSignUpPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const passwordRequirements = [
    { id: "length", label: t("At least 8 characters"), test: (pw: string) => pw.length >= 8 },
    { id: "uppercase", label: t("At least one uppercase letter"), test: (pw: string) => /[A-Z]/.test(pw) },
    { id: "lowercase", label: t("At least one lowercase letter"), test: (pw: string) => /[a-z]/.test(pw) },
    { id: "number", label: t("At least one number"), test: (pw: string) => /[0-9]/.test(pw) },
    { id: "special", label: t("At least one special character"), test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  ];

  const allRequirementsPassed = passwordRequirements.every(({ test }) => test(password));

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast.success(t("Sign in success"));
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || t("Sign in error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error(t("Please enter your full name"));
      return;
    }

    if (!allRequirementsPassed) {
      toast.error(t("Password does not meet requirements"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("Passwords do not match"));
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(email, password, fullName);
      if (error) throw error;

      toast.success(t("auth.signup_success"));
      navigate("/verification")
      // const signInResult = await signIn(email, password);
      // if (signInResult.error) {
      //   toast.error(t("auth.auto_signin_error"));
      // } else {
      //   navigate("/");
      // }
    } catch (error: any) {
      toast.error(error.message || t("auth.signup_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red flex items-center justify-center text-white font-bold text-2xl">
            L
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">{t("Ethio Exam Guidance")}</h1>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="signin">{t("Sign in")}</TabsTrigger>
            <TabsTrigger value="signup">{t("Sign up")}</TabsTrigger>
          </TabsList>

          {/* SIGN IN */}
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>{t("Sign in")}</CardTitle>
                <CardDescription>{t("Sign in with email")}</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("Email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="password">{t("Password")}</Label>
                    <Input
                      id="password"
                      type={signInPasswordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setSignInPasswordVisible((v) => !v)}
                      className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
                      aria-label={signInPasswordVisible ? t("Hide password") : t("Show password")}
                    >
                      {signInPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? t("Loading") : t("Sign in")}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* SIGN UP */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>{t("Sign up")}</CardTitle>
                <CardDescription>{t("Sign up with email")}</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">{t("Full Name")}</Label>
                    <Input
                      id="signup-fullname"
                      type="text"
                      placeholder={t("Your full name")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t("Email")}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="signup-password">{t("Password")}</Label>
                    <Input
                      id="signup-password"
                      type={signUpPasswordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setSignUpPasswordVisible((v) => !v)}
                      className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
                      aria-label={signUpPasswordVisible ? t("Hide password") : t("Show password")}
                    >
                      {signUpPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    {/* Password Requirements List */}
                    <div className="mt-2">
                      {passwordRequirements.map(({ id, label, test }) => {
                        const passed = test(password);
                        return (
                          <p
                            key={id}
                            className={`text-sm flex items-center gap-2 ${
                              passed ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {passed ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            {label}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="signup-confirm-password">{t("Confirm Password")}</Label>
                    <Input
                      id="signup-confirm-password"
                      type={confirmPasswordVisible ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmPasswordVisible((v) => !v)}
                      className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
                      aria-label={confirmPasswordVisible ? t("Hide password") : t("Show password")}
                    >
                      {confirmPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting || !allRequirementsPassed}>
                    {isSubmitting ? t("Loading") : t("Sign up")}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
