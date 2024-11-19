import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-200 mb-2">404 - Page Not Found</h2>
          <p className="text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
