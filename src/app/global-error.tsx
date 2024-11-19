'use client';
 
import { useEffect } from 'react';
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
 
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-red-500 mb-2">
                Something went wrong!
              </h2>
              <p className="text-gray-400 mb-6">
                A critical error occurred. Please try again.
              </p>
              <button
                onClick={() => reset()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
