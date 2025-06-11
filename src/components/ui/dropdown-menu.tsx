'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa6';

type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  placeholder?: string;
  defaultValue?: any;
  className?: string;
  onChange?: (value: string) => void;
};

const Combobox = ({
  options,
  placeholder = 'Select an option',
  defaultValue = '',
  className = '',
  onChange,
}: ComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<ComboboxOption[]>(options);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the label for the selected value
  const selectedLabel = options.find(option => option.value === selectedValue)?.label || '';

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

  const handleSelect = (option: ComboboxOption) => {
    setSelectedValue(option.value);
    setInputValue('');
    setIsOpen(false);
    console.log("on change handler triggered");
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
            {selectedLabel || placeholder}
          </span>
        )}
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
                }`}
                onClick={() => handleSelect(option)}
              >
                {option.label}
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

export default Combobox;