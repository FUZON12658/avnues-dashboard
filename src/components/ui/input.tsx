import React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = ({ className = '', ...props }: InputProps) => {
  return (
    <input
      placeholder='Input'
      className={`w-full px-4 py-[0.75rem] dark:bg-surface-200 border-border border rounded-sm focus:outline-none text-foreground focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-md shadow-primary ${className}`}
      {...props}
    />
  )
}

type IconInputProps = {
  icon?: React.ReactNode;
  iconSrc?: string;
  iconAlt?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  className?: string;
  iconClassName?: string;
  containerClassName?: string;
};

const IconInput = ({
  icon,
  iconSrc,
  iconAlt = "icon",
  inputProps,
  className = '',
  iconClassName = '',
  containerClassName = '',
}: IconInputProps) => {
  return (
    <div className={`relative flex items-center w-full ${containerClassName}`}>
      <div className="absolute left-4 flex items-center justify-center pointer-events-none">
        {icon ? (
          <div className={`text-gray-500 ${iconClassName}`}>{icon}</div>
        ) : iconSrc ? (
          <img 
            src={iconSrc} 
            alt={iconAlt} 
            className={`w-5 h-5 object-contain ${iconClassName}`} 
          />
        ) : null}
      </div>
      
      <input
        {...inputProps}
        placeholder={inputProps?.placeholder || 'Input'}
        className={`w-full px-4 py-3 dark:bg-surface-200 border-border border rounded-sm focus:outline-none text-foreground focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-md shadow-primary ${
          icon || iconSrc ? 'pl-12' : 'pl-4'
        } ${className}`}
      />
    </div>
  );
};

export {
  Input,
  IconInput
}
