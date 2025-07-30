import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FaChevronDown, FaX } from 'react-icons/fa6';

type MultiSelectOption = {
  value: string;
  label: string;
  isRestricted?:boolean;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  placeholder?: string;
  defaultValues?: (string | MultiSelectOption)[];
  className?: string;
  disabled?: boolean;
  onChange?: (values: string[]) => void;
};

const MultiSelect = ({
  options,
  placeholder = 'Select options',
  defaultValues = [],
  className = '',
  disabled,
  onChange,
}: MultiSelectProps) => {
  console.log(options);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Process defaultValues to extract string values - memoized to prevent unnecessary recalculations
  const processedDefaultValues = useMemo(() => {
    return defaultValues.map(item => {
      if (typeof item === 'string') {
        return item;
      } else if (item && typeof item === 'object' && 'value' in item) {
        return item.value;
      }
      return String(item);
    });
  }, [defaultValues]);

  const [selectedValues, setSelectedValues] = useState<string[]>(processedDefaultValues);

  // Use useRef to track if we should sync with defaultValues
  const isInitialMount = useRef(true);
  const lastDefaultValues = useRef<string[]>(processedDefaultValues);

  // Only sync with defaultValues if they actually changed (not due to internal state changes)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Check if defaultValues actually changed
    const currentDefaults = processedDefaultValues;
    const prevDefaults = lastDefaultValues.current;
    
    if (JSON.stringify(currentDefaults) !== JSON.stringify(prevDefaults)) {
      setSelectedValues(currentDefaults);
      lastDefaultValues.current = currentDefaults;
    }
  }, [processedDefaultValues]);

  // Memoize filtered options to prevent unnecessary recalculations
  const filteredOptions = useMemo(() => {
    return options.filter(option =>
      option && option.label && option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, options]);

  // Filter out options that are already selected
  const availableOptions = useMemo(() => {
    return filteredOptions.filter(option => !selectedValues.includes(option.value));
  }, [filteredOptions, selectedValues]);

  // Memoize onChange callback to prevent unnecessary re-renders
  const stableOnChange = useCallback(onChange || (() => {}), [onChange]);

  // Use useRef to prevent onChange from triggering on initial render
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }
    // Only call onChange after initial render and when values actually change
    stableOnChange(selectedValues);
  }, [selectedValues, stableOnChange]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = useCallback((option: MultiSelectOption) => {
        if (disabled) return;
        if (option.isRestricted) return;
    setSelectedValues(prev => [...prev, option.value]);
    setInputValue('');
    // Keep focus on input after selection
    inputRef.current?.focus();
  }, []);

  const handleRemove = useCallback((valueToRemove: string) => {
        if (disabled) return;
    setSelectedValues(prev => prev.filter(value => value !== valueToRemove));
  }, []);

  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    setInputValue('');
    // Focus the input when opening
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to remove the last selected option when input is empty
    if (e.key === 'Backspace' && inputValue === '' && selectedValues.length > 0) {
      setSelectedValues(prev => prev.slice(0, -1));
    }
  }, [inputValue, selectedValues.length]);

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div
        className={`flex flex-wrap items-center w-full px-3 py-2  border-border border rounded-sm text-foreground  min-h-12 ${
          isOpen ? 'ring-2 ring-primary border-transparent shadow-md shadow-primary' : ''
        }  ${disabled?"cursor-not-allowed bg-surface-400 dark:bg-surface-400":"cursor-text dark:bg-surface-200"}`}
        onClick={toggleDropdown}
      >
        {selectedValues.length > 0 && (
            <div className={`flex flex-wrap gap-2 mr-2 ${disabled?"cursor-not-allowed bg-surface-400 dark:bg-surface-400":"cursor-text dark:bg-surface-200"}`}>
            {selectedValues.map(value => {
              const option = options.find(opt => opt.value === value);
              return (
                <div 
                  key={value}
                  className={`flex items-center gap-1  rounded-md px-2 py-1 text-sm ${disabled?"cursor-not-allowed bg-surface-300 dark:bg-surface-600":"bg-gray-200 dark:bg-surface-300"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{option?.label || value}</span>
                 {!disabled && <span
                    className="cursor-pointer hover:text-red-500 ml-1 flex items-center justify-center w-4 h-4"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(value);
                    }}
                  >
                     <FaX size={10} />
                  </span>}
                </div>
              );
            })}
          </div>
        )}
        <input
          ref={inputRef}
          className={`flex-grow bg-transparent focus:outline-none min-w-20 ${disabled?"cursor-not-allowed bg-surface-400 dark:bg-surface-400":""} ${selectedValues.length > 0 ? 'w-auto' : 'w-full'}`}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={selectedValues.length > 0 ? '' : placeholder}
          disabled={disabled}
        />
        {!disabled && <FaChevronDown
          size={18}
          className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-surface-200 border border-border rounded-sm shadow-lg max-h-60 overflow-auto">
          {availableOptions.length > 0 ? (
            availableOptions.map((option) => (
              <div
                key={option.value}
                className={`px-4 py-2  hover:bg-gray-100 dark:hover:bg-surface-300 ${option.isRestricted ? "cursor-not-allowed text-surface-600":"cursor-pointer"}`}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">
              {inputValue ? 'No options found' : 'All options selected'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;