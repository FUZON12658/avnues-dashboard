import React, { useState, useEffect } from 'react';
import { Github, Mail, ExternalLink, Download, Calendar, Code, Briefcase } from 'lucide-react';

// Custom Accordion Component Types
interface CustomAccordionProps {
  children: React.ReactNode;
  type?: "single" | "multiple";
  className?: string;
}

interface CustomAccordionItemProps {
  children: React.ReactNode;
  value: string;
}

interface CustomAccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

interface CustomAccordionContentProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

// Custom Tabs Component Types
interface CustomTabsProps {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}

interface CustomTabsListProps {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

interface CustomTabsTriggerProps {
  children: React.ReactNode;
  value: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

interface CustomTabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  activeTab?: string;
}

// Brutalist Minimalist Accordion
const CustomAccordion: React.FC<CustomAccordionProps> = ({ children, type = "multiple", className = "" }) => (
  <div className={`w-full ${className}`}>{children}</div>
);

const CustomAccordionItem: React.FC<CustomAccordionItemProps> = ({ children, value }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  
  return (
    <div className="mb-3 rounded-md overflow-visible" style={{ 
      backgroundColor: 'var(--surface-100)',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border-light)'
    }}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === CustomAccordionTrigger) {
          return React.cloneElement(child as React.ReactElement<CustomAccordionTriggerProps>, { isOpen, setIsOpen });
        }
        if (React.isValidElement(child) && child.type === CustomAccordionContent) {
          return React.cloneElement(child as React.ReactElement<CustomAccordionContentProps>, { isOpen });
        }
        return child;
      })}
    </div>
  );
};

const CustomAccordionTrigger: React.FC<CustomAccordionTriggerProps> = ({ children, className = "", isOpen, setIsOpen }) => (
  <button
    type="button"
    onClick={() => setIsOpen?.(!isOpen)}
    className={`w-full px-4 py-3 text-left font-medium flex justify-between items-center hover:bg-opacity-80 transition-all duration-200 group ${className}`}
    style={{ 
      backgroundColor: 'var(--surface-200)', 
      color: 'var(--foreground)'
    }}
  >
    <span className="text-sm">{children}</span>
    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
         style={{ backgroundColor: 'var(--surface-400)', color: 'var(--foreground)' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  </button>
);

const CustomAccordionContent: React.FC<CustomAccordionContentProps> = ({ children, className = "", isOpen }) => (
  <div className={`transition-all duration-300 ease-out ${isOpen ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
    <div 
      className={`px-4 py-3 ${className}`}
      style={{ 
        backgroundColor: 'var(--surface-100)', 
        color: 'var(--foreground)',
        overflow: 'visible'
      }}
    >
      {children}
    </div>
  </div>
);

// Brutalist Minimalist Tabs
const CustomTabs: React.FC<CustomTabsProps> = ({ children, defaultValue, className = "" }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  
  return (
    <div className={`w-full ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === CustomTabsList) {
          return React.cloneElement(child as React.ReactElement<CustomTabsListProps>, { activeTab, setActiveTab });
        }
        if (React.isValidElement(child) && child.type === CustomTabsContent) {
          return React.cloneElement(child as React.ReactElement<CustomTabsContentProps>, { activeTab });
        }
        return child;
      })}
    </div>
  );
};

const CustomTabsList: React.FC<CustomTabsListProps> = ({ children, className = "", activeTab, setActiveTab }) => (
  <div className={`flex rounded-md overflow-hidden mb-3 ${className}`} style={{ 
    backgroundColor: 'var(--surface-100)',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-sm)'
  }}>
    {React.Children.map(children, (child) => 
      React.isValidElement(child) 
        ? React.cloneElement(child as React.ReactElement<CustomTabsTriggerProps>, { activeTab, setActiveTab })
        : child
    )}
  </div>
);

const CustomTabsTrigger: React.FC<CustomTabsTriggerProps> = ({ children, value, activeTab, setActiveTab }) => (
  <button
    type="button"
    onClick={() => setActiveTab?.(value)}
    className={`px-4 py-3 font-medium flex-1 transition-all duration-200 hover:bg-opacity-80 relative text-sm ${
      activeTab === value ? '' : ''
    }`}
    style={{
      backgroundColor: activeTab === value ? 'var(--surface-300)' : 'transparent',
      color: 'var(--foreground)'
    }}
  >
    <span className="relative z-10">{children}</span>
    {activeTab === value && (
      <div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full"
        style={{ backgroundColor: 'var(--surface-600)' }}
      />
    )}
  </button>
);

const CustomTabsContent: React.FC<CustomTabsContentProps> = ({ children, value, className = "", activeTab }) => (
  <div className={`${activeTab === value ? 'block' : 'hidden'} ${className}`}>
    <div 
      className="rounded-md p-4 transition-all duration-200" 
      style={{ 
        backgroundColor: 'var(--surface-100)', 
        border: '1px solid var(--border-light)', 
        color: 'var(--foreground)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {children}
    </div>
  </div>
);

export {
  CustomAccordion,
  CustomAccordionItem,
  CustomAccordionTrigger,
  CustomAccordionContent,
  CustomTabs,
  CustomTabsList,
  CustomTabsTrigger,
  CustomTabsContent
};