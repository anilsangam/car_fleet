import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'animate-pulse bg-slate-200/80',
          variant === 'circular' && 'rounded-full',
          variant === 'text' && 'h-4 rounded',
          variant === 'rectangular' && 'rounded-xl',
          className
        )
      )}
      {...props}
    />
  );
};

