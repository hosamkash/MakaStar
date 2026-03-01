import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import PageHeader from "@/components/page-header"

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4">
        <Skeleton className="h-8 w-[200px]" />
      </div>
      <Card>
        <CardHeader className="p-4">
          <Skeleton className="h-10 w-[200px]" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
        <CardFooter className="p-4">
          <Skeleton className="h-10 w-[150px]" />
        </CardFooter>
      </Card>
    </div>
  )
}