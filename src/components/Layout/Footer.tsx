import React from "react";
import { Link } from "react-router-dom";
import { Award, Github, Instagram, Twitter } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
const Footer = () => {
  const {
    t
  } = useLanguage();
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full bg-secondary py-8 md:py-12">
      <div className="container grid gap-8 px-4 md:px-6 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Award className="size-5 text-ethiopia-green" />
            <span className="font-semibold">{t("Ethio Exam Guidance")}</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-md">
            {t("Ethio Exam Guidance is your ultimate companion for acing the national university entrance exams. This platform offers personalized performance analysis, tailored study materials, a vast question bank, and 24/7 support to help you prepare with confidence. Available in Amharic, it ensures that every student has the resources and guidance they need to succeed.")}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:gap-6 lg:col-span-2">
          <div>
            <h3 className="mb-3 text-sm font-medium">{t("Resources")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/subjects" className="hover:text-foreground">
                  {t("Subjects")}
                </Link>
              </li>
              <li>
                <Link to="/exam" className="hover:text-foreground">
                  {t("Exams")}
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground">
                  {t("Materials")}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-3 text-sm font-medium">{t("AASTU")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="#" className="hover:text-foreground">
                  {t("About")}
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground">
                  {t("Contact")}
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground">
                  {t("Privacy Policy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="container mt-8 border-t border-border pt-8 px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {currentYear} {t("Ethio Exam Guidance")}. {t("Copyright 2025")}
          </p>
          <div className="flex items-center space-x-4">
            <Link
              to="#"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Twitter"
            >
              <Twitter className="size-4" />
            </Link>
            <Link
              to="#"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Instagram"
            >
              <Instagram className="size-4" />
            </Link>
            <Link
              to="#"
              className="text-muted-foreground hover:text-foreground"
              aria-label="GitHub"
            >
              <Github className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
