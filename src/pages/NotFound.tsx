
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glassmorphism border border-mondo-purple/50 rounded-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-mondo-purple/20 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-mondo-purple" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mondo-purple to-mondo-blue mb-4">404</h1>
          <p className="text-xl text-white mb-2">Page Not Found</p>
          <p className="text-gray-400 mb-8">
            The blockchain couldn't validate this route. Perhaps it's on another chain?
          </p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-mondo-purple to-mondo-blue text-white w-full">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
