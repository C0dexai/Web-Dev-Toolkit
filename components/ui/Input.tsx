
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  const baseClasses = "block w-full bg-black/30 border border-border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm text-text-primary placeholder:text-text-secondary/60";
  return <input className={`${baseClasses} ${className}`} {...props} />;
};

export default Input;