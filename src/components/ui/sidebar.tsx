
import * as React from "react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { 
  BookOpen, 
  Home, 
  PencilRuler, 
  User, 
  BarChart3, 
  Bot, 
  Shield,
  School,
  PiggyBank
} from "lucide-react";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  end?: boolean;
}

export function Sidebar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  
  const NavItem = ({ to, icon, children, end = false }: NavItemProps) => {
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            isActive && "bg-muted font-medium text-primary"
          )
        }
      >
        {icon}
        <span>{children}</span>
      </NavLink>
    );
  };
  
  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            {t("Main")}
          </h2>
          <div className="space-y-1">
            <NavItem to="/" icon={<Home className="h-4 w-4" />} end>
              {t("Home")}
            </NavItem>
            <NavItem
              to="/subjects"
              icon={<BookOpen className="h-4 w-4" />}
            >
              {t("Subjects")}
            </NavItem>
            <NavItem
              to="/exam"
              icon={<PencilRuler className="h-4 w-4" />}
            >
              {t("Exam")}
            </NavItem>
            <NavItem
              to="/teacher-connect"
              icon={<School className="h-4 w-4" />}
            >
              {t("Teacher Connect") || "Teacher Connect"}
            </NavItem>
            <NavItem
              to="/questionBank"
              icon={<PiggyBank className="h-4 w-4" />}
            >
              {t("Question Bank")}
            </NavItem>
          </div>
        </div>
        <div className="py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            {t("Personal")}
          </h2>
          <div className="space-y-1">
            <NavItem
              to="/profile"
              icon={<User className="h-4 w-4" />}
            >
              {t("Profile")}
            </NavItem>
            <NavItem
              to="/performance"
              icon={<BarChart3 className="h-4 w-4" />}
            >
              {t("Performance")}
            </NavItem>
            <NavItem
              to="/ai-assistant"
              icon={<Bot className="h-4 w-4" />}
            >
              {t("Ai Assistant")}
            </NavItem>
            {isAdmin && isAdmin() && (
              <NavItem
                to="/admin"
                icon={<Shield className="h-4 w-4 text-red-500" />}
              >
                {t("Admin")}
              </NavItem>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
