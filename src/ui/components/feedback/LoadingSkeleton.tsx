interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  animated?: boolean;
}

export function LoadingSkeleton({ 
  lines = 3, 
  className = '', 
  animated = true 
}: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
            animated ? 'animate-pulse' : ''
          } ${i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

interface ExpenseItemSkeletonProps {
  count?: number;
  animated?: boolean;
}

export function ExpenseItemSkeleton({ count = 3, animated = true }: ExpenseItemSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`card p-4 ${animated ? 'animate-pulse' : ''}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="space-y-1 text-right">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface FormSkeletonProps {
  fields?: number;
  animated?: boolean;
}

export function FormSkeleton({ fields = 3, animated = true }: FormSkeletonProps) {
  return (
    <div className={`card p-6 space-y-4 ${animated ? 'animate-pulse' : ''}`}>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
      
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
      
      <div className="pt-2">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}
