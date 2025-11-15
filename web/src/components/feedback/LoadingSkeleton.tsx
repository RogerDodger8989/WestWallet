import React from 'react';

const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="animate-pulse space-y-2">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-full" />
    ))}
  </div>
);

export default LoadingSkeleton;
