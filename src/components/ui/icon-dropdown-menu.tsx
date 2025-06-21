'use client';
import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import { IconSvgObject } from '../common/modern-table-page';
import { HugeiconsIcon } from '@hugeicons/react';

type IconComboboxOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

type IconComboboxProps = {
  options: IconComboboxOption[];
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  leftIcon?: IconSvgObject;
  onChange?: (value: string) => void;
};

const IconCombobox = ({
  options,
  placeholder = 'Select an option',
  defaultValue = '',
  className = '',
  leftIcon,
  onChange,
}: IconComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<IconComboboxOption[]>(options);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the selected option
  const selectedOption = options.find(option => option.value === selectedValue);

  useEffect(() => {
    // Filter options based on input value
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [inputValue, options]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: IconComboboxOption) => {
    setSelectedValue(option.value);
    setInputValue('');
    setIsOpen(false);
    onChange && onChange(option.value);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setInputValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div
        className={`flex items-center w-full px-4 py-3 dark:bg-surface-200 border-border border rounded-sm text-foreground cursor-pointer ${
          isOpen ? 'ring-2 ring-primary border-transparent shadow-md shadow-primary' : ''
        }`}
        onClick={toggleDropdown}
      >
        {/* Left Icon (if provided) */}
        {leftIcon && (
          <div className="mr-3 text-gray-500">
            <HugeiconsIcon icon={leftIcon} />
          </div>
        )}

        {/* Selected Option Icon */}
        {!isOpen && selectedOption?.icon && (
          <div className="mr-2">
            {selectedOption.icon}
          </div>
        )}

        {/* Input or Selection Display */}
        {isOpen ? (
          <input
            className="flex-grow bg-transparent focus:outline-none"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            autoFocus
          />
        ) : (
          <span className={`flex-grow ${!selectedValue ? 'text-gray-400' : ''}`}>
            {selectedOption?.label || placeholder}
          </span>
        )}

        {/* Dropdown Arrow */}
        <FaChevronDown
          size={18}
          className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-surface-200 border border-border rounded-sm shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-surface-300 ${
                  option.value === selectedValue ? 'bg-gray-100 dark:bg-surface-300' : ''
                } flex items-center`}
                onClick={() => handleSelect(option)}
              >
                {option.icon && <div className="mr-2">{option.icon}</div>}
                <span>{option.label}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">No options found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default IconCombobox;
