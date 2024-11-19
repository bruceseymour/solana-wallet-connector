export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-200 mt-4">Loading...</h2>
          <p className="text-gray-400 mt-2">Please wait while we set things up</p>
        </div>
      </div>
    </div>
  );
}
