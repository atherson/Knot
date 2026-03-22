import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-green-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-32 h-32 mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-20" />
          <div className="relative w-full h-full rounded-full gradient-orange flex items-center justify-center">
            <span className="text-6xl font-bold text-white">404</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          Oops! The page you're looking for seems to have wandered off campus. 
          Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Link to="/">
            <Button className="gradient-orange text-white flex items-center gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
