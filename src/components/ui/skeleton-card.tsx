"use client";
// Reusable skeleton primitives for CLS-safe loading states

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 dark:bg-slate-700 rounded animate-pulse ${className}`}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 animate-pulse ${className}`}
    >
      <SkeletonLine className="h-4 w-2/3 mb-3" />
      <SkeletonLine className="h-3 w-full mb-2" />
      <SkeletonLine className="h-3 w-4/5" />
    </div>
  );
}
