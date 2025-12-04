import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center card-elevated p-12 gold-border">
        <h1 className="mb-4 text-6xl font-bold gradient-gold-text">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Page not found</p>
        <Button asChild className="rounded-xl">
          <Link to="/">
            <Home className="mr-2" size={18} />
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
