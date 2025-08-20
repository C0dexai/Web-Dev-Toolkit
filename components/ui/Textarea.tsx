
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea: React.FC<TextareaProps> = ({ className, ...props }) => {
  const baseClasses = "block w-full bg-black/30 border border-border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm text-text-primary resize-none placeholder:text-text-secondary/60";
  return <textarea className={`${baseClasses} ${className}`} {...props} />;
};

export default Textarea;