import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2 text-foreground">404 - Page Not Found</h1>

        <p className="text-muted-foreground mb-6">
          Sorry, we couldn’t find the page <span className="font-mono">{location.pathname}</span>. 
          It might have been removed, renamed, or you may have followed a broken link.
        </p>

        <Button asChild variant="default">
          <a href="/home" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back Home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
