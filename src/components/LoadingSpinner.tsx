export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-700 rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
      </div>
      <span className="ml-4 text-gray-300">Researching stock...</span>
    </div>
  );
}
