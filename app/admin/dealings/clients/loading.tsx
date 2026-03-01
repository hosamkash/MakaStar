import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientsLoading() {
  return (
    <div className="container p-4 sm:p-6 lg:p-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <Card>
        <CardHeader className="p-4">
          <Skeleton className="h-10 w-64" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[1200px]">
                             {/* Table Header Skeleton */}
               <div className="border-b">
                 <div className="grid grid-cols-11 gap-4 p-4">
                   <Skeleton className="h-6 w-16" />
                   <Skeleton className="h-6 w-20" />
                   <Skeleton className="h-6 w-16" />
                   <Skeleton className="h-6 w-16" />
                   <Skeleton className="h-6 w-16" />
                   <Skeleton className="h-6 w-24" />
                   <Skeleton className="h-6 w-20" />
                   <Skeleton className="h-6 w-20" />
                   <Skeleton className="h-6 w-16" />
                   <Skeleton className="h-6 w-16" />
                   <Skeleton className="h-6 w-16" />
                 </div>
               </div>

               {/* Table Rows Skeleton */}
               {Array.from({ length: 10 }).map((_, index) => (
                 <div key={index} className="border-b">
                   <div className="grid grid-cols-11 gap-4 p-4">
                     <div className="flex gap-2">
                       <Skeleton className="h-8 w-8" />
                       <Skeleton className="h-8 w-8" />
                     </div>
                     <Skeleton className="h-6 w-24" />
                     <Skeleton className="h-6 w-16" />
                     <Skeleton className="h-4 w-4" />
                     <Skeleton className="h-4 w-4" />
                     <Skeleton className="h-6 w-20" />
                     <Skeleton className="h-6 w-16" />
                     <Skeleton className="h-6 w-32" />
                     <Skeleton className="h-6 w-24" />
                     <Skeleton className="h-6 w-24" />
                     <Skeleton className="h-6 w-12" />
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </CardContent>
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
