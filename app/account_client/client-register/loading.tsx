export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full mr-3 animate-pulse"></div>
            <div>
              <div className="w-32 h-8 bg-gray-300 rounded mb-2 animate-pulse"></div>
              <div className="w-48 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-64 h-4 bg-gray-300 rounded mx-auto animate-pulse"></div>
        </div>

        {/* Card Skeleton */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="w-48 h-8 bg-gray-300 rounded mb-2 animate-pulse"></div>
            <div className="w-64 h-4 bg-gray-300 rounded animate-pulse"></div>
          </div>

          {/* Form Skeleton */}
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-full h-10 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-full h-24 bg-gray-300 rounded animate-pulse"></div>
            </div>

            {/* Login Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="w-28 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-full h-10 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-full h-10 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-full h-24 bg-gray-300 rounded animate-pulse"></div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="w-full h-12 bg-gray-300 rounded animate-pulse"></div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center space-y-2">
              <div className="w-80 h-3 bg-gray-300 rounded mx-auto animate-pulse"></div>
              <div className="w-64 h-3 bg-gray-300 rounded mx-auto animate-pulse"></div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-4">
            <div className="w-full h-10 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="w-48 h-4 bg-gray-300 rounded mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
