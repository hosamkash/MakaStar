import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 bg-blue-500" />
            <Skeleton className="w-8 h-8 bg-blue-500" />
          </div>
          <Skeleton className="w-20 h-6 bg-blue-500" />
          <Skeleton className="w-8 h-8 bg-blue-500" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Profile Information Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
            <Skeleton className="w-32 h-6 mx-auto mb-2" />
            <Skeleton className="w-20 h-4 mx-auto" />
          </CardContent>
        </Card>

        {/* Account Settings Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100">
              <Skeleton className="w-32 h-6 float-right" />
            </div>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between p-4">
                <Skeleton className="w-5 h-5" />
                <div className="flex items-center gap-3">
                  <Skeleton className="w-24 h-5" />
                  <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <Skeleton className="w-5 h-5" />
                <div className="flex items-center gap-3">
                  <Skeleton className="w-28 h-5" />
                  <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100">
              <Skeleton className="w-36 h-6 float-right" />
            </div>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between p-4">
                <Skeleton className="w-5 h-5" />
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Skeleton className="w-20 h-5 mb-1" />
                    <Skeleton className="w-32 h-4" />
                  </div>
                  <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <Skeleton className="w-5 h-5" />
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Skeleton className="w-24 h-5 mb-1" />
                    <Skeleton className="w-36 h-4" />
                  </div>
                  <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shopping Section Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100">
              <Skeleton className="w-16 h-6 float-right" />
            </div>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between p-4">
                <Skeleton className="w-5 h-5" />
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Skeleton className="w-24 h-5" />
                  </div>
                  <Skeleton className="w-16 h-6 rounded-full" />
                  <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <Skeleton className="w-5 h-5" />
                <div className="flex items-center gap-3">
                  <Skeleton className="w-28 h-5" />
                  <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <Skeleton className="w-5 h-5" />
                <div className="flex items-center gap-3">
                  <Skeleton className="w-20 h-5" />
                  <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button Skeleton */}
        <Skeleton className="w-full h-12 rounded-lg" />
      </div>

      {/* Bottom Navigation Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center p-2">
              <Skeleton className="w-6 h-6 rounded mb-1" />
              <Skeleton className="w-12 h-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
