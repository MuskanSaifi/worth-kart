interface SellerPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SellerPageHeader({ title, description, action }: SellerPageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

interface SellerCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function SellerCard({ children, className = "", title }: SellerCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      {title && <h2 className="text-sm font-semibold text-gray-700 mb-4">{title}</h2>}
      {children}
    </div>
  );
}

interface StatBadgeProps {
  label: string;
  value: string | number;
  trend?: number;
}

export function StatBadge({ label, value, trend }: StatBadgeProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs last week
        </p>
      )}
    </div>
  );
}
