export default function GatheringLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-4 w-32 bg-light-gray rounded animate-pulse mb-4" />
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-72 bg-light-gray rounded-btn animate-pulse" />
          <div className="h-6 w-16 bg-light-gray rounded-pill animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-light-gray rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress bar skeleton */}
          <div className="rounded-card bg-white shadow-resting p-6">
            <div className="h-5 w-40 bg-light-gray rounded animate-pulse mb-4" />
            <div className="h-2 w-full bg-light-gray rounded-full animate-pulse" />
          </div>

          {/* Module cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-card bg-white shadow-resting p-6">
                <div className="h-10 w-10 bg-light-gray rounded-lg animate-pulse mb-4" />
                <div className="h-5 w-32 bg-light-gray rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-light-gray rounded animate-pulse mb-4" />
                <div className="h-6 w-20 bg-light-gray rounded-pill animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-6">
          <div className="rounded-card bg-white shadow-resting p-6">
            <div className="h-5 w-28 bg-light-gray rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-light-gray rounded animate-pulse" />
                  <div className="h-4 w-16 bg-light-gray rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
