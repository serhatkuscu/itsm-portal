export const STATUS_COLORS: Record<string, string> = {
  Open:            'bg-blue-100 text-blue-700',
  InProgress:      'bg-yellow-100 text-yellow-700',
  WaitingCustomer: 'bg-orange-100 text-orange-700',
  Resolved:        'bg-green-100 text-green-700',
  Closed:          'bg-gray-100 text-gray-600',
  Cancelled:       'bg-red-100 text-red-600',
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low:      'bg-slate-100 text-slate-600',
  Medium:   'bg-blue-100 text-blue-700',
  High:     'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

interface BadgeProps {
  label: string;
  colorClass: string;
}

export function Badge({ label, colorClass }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge label={status} colorClass={STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge label={priority} colorClass={PRIORITY_COLORS[priority] ?? 'bg-gray-100 text-gray-600'} />;
}
