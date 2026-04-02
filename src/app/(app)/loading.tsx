export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Hero skeleton */}
      <div className="mb-8">
        <div className="h-8 w-64 bg-light-gray rounded-btn animate-pulse mb-3" />
        <div className="h-5 w-96 bg-light-gray rounded-btn animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-card bg-white shadow-resting p-6">
            <div className="h-4 w-24 bg-light-gray rounded animate-pulse mb-3" />
            <div className="h-8 w-16 bg-light-gray rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-card bg-white shadow-resting p-6">
            <div className="h-5 w-48 bg-light-gray rounded animate-pulse mb-4" />
            <div className="h-4 w-32 bg-light-gray rounded animate-pulse mb-2" />
            <div className="h-4 w-40 bg-light-gray rounded animate-pulse mb-4" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-light-gray rounded-pill animate-pulse" />
              <div className="h-6 w-20 bg-light-gray rounded-pill animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
