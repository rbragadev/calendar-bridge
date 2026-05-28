interface BadgeProps {
  variant?: 'active' | 'inactive' | 'info' | 'error' | 'warning';
  children: React.ReactNode;
}

const variants = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  info: 'bg-brand-100 text-brand-700',
  error: 'bg-red-100 text-red-600',
  warning: 'bg-orange-100 text-orange-600',
};

export default function Badge({ variant = 'info', children }: BadgeProps) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${variants[variant]}`}>
      {children}
    </span>
  );
}
