import React from 'react';

type HeadingProps = {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; // Restrict to valid heading levels
  children: React.ReactNode;
  className?: string;
};

type SubHeadingProps = {
  variant?: 'sh1'; // Restrict to valid heading levels
  children: React.ReactNode;
  className?: string;
};

type BodyProps = {
  variant: 'big' | 'medium' | 'mediumbold' | 'regular' | 'small' | 'small-medium' | "trimmed" | 'small-trimmed'; // Restrict to valid heading levels
  children: React.ReactNode;
  className?: string;
};

export const Heading: React.FC<HeadingProps> = ({
  variant = 'h1', // Default to 'h1' ensures `variant` is never undefined
  children,
  className = '',
}) => {
  const baseClasses: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', string> = {
    h1: 'text-[2.25rem] leading-[2.25rem] md:text-[3.75rem] md:leading-[3.75rem] font-bold',
    h2: 'text-[1.5rem] leading-[1.8rem] md:text-[2.5rem] md:leading-[3rem] font-bold',
    h3: 'text-[1.25rem] leading-[1.5rem] md:text-[1.5rem] md:leading-[1.8rem] font-bold',
    h4: 'text-[1rem] leading-[1.25rem] md:text-[1.125rem] md:leading-[1.35rem] font-bold',
    h5: 'text-[0.874rem] leading-[1.3125rem] md:text-[1.125rem] md:leading-[2.025rem] font-semibold',
    h6: 'text-[0.875rem] leading-[1.3125rem] md:text-[1rem] md:leading-[1.5rem] font-semibold',
  };

  const Component = variant as keyof React.JSX.IntrinsicElements;

  return (
    <Component
      className={`${baseClasses[variant]}  ${className}`}
    >
      {children}
    </Component>
  );
};

export const SubHeading: React.FC<SubHeadingProps> = ({
  variant = 'sh1', // Default to 'h1' ensures `variant` is never undefined
  children,
  className = '',
}) => {
  const baseClasses: Record<'sh1', string> = {
    sh1: 'text-[0.875rem] leading-[1.3125rem] md:text-[1.375rem] md:leading-[2.0625rem] font-family-poppins font-normal'
  };

  return (
    <div
      className={`${baseClasses[variant]}  ${className}`}
    >
      {children}
    </div>
  );
};

export const BodyText: React.FC<BodyProps> = ({
  variant , // Default to 'h1' ensures `variant` is never undefined
  children,
  className = '',
}) => {
  const baseClasses: Record<'big' | 'medium' | 'mediumbold' | 'regular' | 'small' | 'small-medium' | "trimmed" | 'small-trimmed', string> = {
    big: 'text-[1rem] md:text-[2.25rem] leading-[1.5rem] md:leading-[3.75rem] tracking-0 font-medium',
    medium: 'text-[0.875rem] leading-[1.3125rem] md:text-[1rem] md:leading-[1.6rem] tracking-0',
    mediumbold: 'text-[0.875rem] leading-[1.3125rem] md:text-[1rem] md:leading-[1.6rem] tracking-0',
    regular: 'text-[0.875rem] leading-[1.3125rem] md:text-[1rem] md:leading-[1.75rem] tracking-0',
    small: 'text-[0.75rem] leading-[1.125rem] md:text-[0.875rem] leading-[1.3125rem]',
    'small-medium':'text-[0.75rem] leading-[1.125rem] md:text-[0.875rem] md:leading-[1.3125rem]',
    trimmed: 'text-[0.75rem] leading-[1.3125rem] md:text-[1rem] md:leading-[1.5rem]',
    'small-trimmed': 'text-[0.75rem] leading-[1.125rem]  md:text-[0.875rem] md:leading-[1.3125rem]'
  };

  return (
    <div
      className={`${baseClasses[variant]}  ${className}`}
    >
      {children}
    </div>
  );
};

