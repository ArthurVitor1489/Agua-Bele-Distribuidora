import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  trend?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors min-w-0">
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 tracking-tight truncate">
          {value}
        </h3>
      </div>
      {(subtitle || trend) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 min-w-0">
          <span className="truncate">{subtitle}</span>
          {trend && <span className="font-semibold text-brand-600 shrink-0">{trend}</span>}
        </div>
      )}
    </div>
  );
}
