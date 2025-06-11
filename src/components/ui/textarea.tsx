import React from 'react'

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = ({ className = '', ...props }: TextareaProps) => {
  return (
    <textarea
      placeholder="Textarea"
      rows={4}
      className={`w-full px-4 py-[0.75rem] dark:bg-surface-200 border-border  border rounded-sm focus:outline-none text-foreground focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-md shadow-primary ${className}`}
      {...props}
    />
  )
}


