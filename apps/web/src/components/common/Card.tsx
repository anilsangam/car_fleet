import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all',
          hoverEffect && 'hover:shadow-md hover:border-slate-300 transition-all duration-200',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

