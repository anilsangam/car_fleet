import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Phone } from 'lucide-react';
import { validateIndianMobileNumber } from '@car-rental/shared';

export interface IndianMobileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  validateOnBlur?: boolean;
  onValidationError?: (err?: string) => void;
}

export const IndianMobileInput = React.forwardRef<HTMLInputElement, IndianMobileInputProps>(
  (
    {
      label = 'Mobile Number',
      value,
      onChange,
      error,
      helperText = '10-digit mobile number starting with 6, 7, 8, or 9',
      required = false,
      onBlur,
      validateOnBlur = true,
      onValidationError,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || 'mobile-input';
    const [touched, setTouched] = useState(false);
    const [internalError, setInternalError] = useState<string | undefined>(undefined);

    const activeError = error !== undefined ? error : internalError;

    const handleDigitChange = (raw: string) => {
      // 1. Strip all non-digit characters
      let digits = raw.replace(/\D/g, '');

      // 2. Normalize +91 or 0 prefix if user typed or pasted with it
      if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
      }

      // 3. Strictly restrict to maximum 10 digits (stops 11th digit)
      const sanitized = digits.slice(0, 10);
      onChange(sanitized);

      // 4. Live error clearing if valid or as user types
      if (activeError) {
        if (sanitized.length === 10 && /^[6-9]/.test(sanitized)) {
          setInternalError(undefined);
          if (onValidationError) onValidationError(undefined);
        } else if (sanitized.length === 0) {
          setInternalError(undefined);
          if (onValidationError) onValidationError(undefined);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow control keys (Backspace, Delete, Tab, Arrow keys, Enter, Escape, Copy, Paste, Cut, Select All)
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'Enter' ||
        e.key === 'Escape' ||
        (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) ||
        (e.metaKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
      ) {
        return;
      }

      // If user presses a non-digit character, prevent typing
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
        return;
      }

      // If user already has 10 digits and hasn't highlighted text to replace, prevent typing 11th digit
      const input = e.currentTarget;
      const hasSelection =
        input.selectionStart !== null &&
        input.selectionEnd !== null &&
        input.selectionStart !== input.selectionEnd;

      if (value.length >= 10 && !hasSelection) {
        e.preventDefault();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      handleDigitChange(pasted);
    };

    const handleBlurEvent = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      if (validateOnBlur) {
        if (!value.trim()) {
          if (required) {
            const err = 'Mobile number is required.';
            setInternalError(err);
            if (onValidationError) onValidationError(err);
          } else {
            setInternalError(undefined);
            if (onValidationError) onValidationError(undefined);
          }
        } else {
          const res = validateIndianMobileNumber(value);
          if (!res.isValid) {
            setInternalError(res.error);
            if (onValidationError) onValidationError(res.error);
          } else {
            setInternalError(undefined);
            if (onValidationError) onValidationError(undefined);
          }
        }
      }

      if (onBlur) {
        onBlur(e);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {/* Prefix with Indian flag and +91 code */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 gap-1.5 text-xs font-semibold select-none">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-mono tracking-tight">+91</span>
            <span className="text-slate-300">|</span>
          </div>

          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            disabled={disabled}
            value={value}
            onChange={(e) => handleDigitChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlurEvent}
            placeholder="9876543210"
            className={twMerge(
              clsx(
                'w-full rounded-xl border bg-white pl-16 pr-3.5 py-2.5 text-sm font-mono tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-sans transition-all focus:outline-none focus:ring-2 focus:ring-offset-1',
                activeError
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
                disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed',
                className
              )
            )}
            {...props}
          />
        </div>

        {activeError ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{activeError}</p>
        ) : (
          helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

IndianMobileInput.displayName = 'IndianMobileInput';

