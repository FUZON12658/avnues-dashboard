import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaX     } from 'react-icons/fa6';


type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  placeholder?: string;
  defaultValues?: string[];
  className?: string;
  onChange?: (values: string[]) => void;
};

const MultiSelect = ({
  options,
  placeholder = 'Select options',
  defaultValues = [],
  className = '',
  onChange,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValues);
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<MultiSelectOption[]>(options);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter out options that are already selected
  const availableOptions = filteredOptions.filter(
    option => !selectedValues.includes(option.value)
  );

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
        setInputValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Call onChange when selected values change
    onChange && onChange(selectedValues);
  }, [selectedValues, onChange]);

  const handleSelect = (option: MultiSelectOption) => {
    const newSelectedValues = [...selectedValues, option.value];
    setSelectedValues(newSelectedValues);
    setInputValue('');
    // Keep focus on input after selection
    inputRef.current?.focus();
  };

  const handleRemove = (valueToRemove: string, event?: React.MouseEvent) => {
    // Prevent the dropdown from toggling
    event?.stopPropagation();
    
    const newSelectedValues = selectedValues.filter(
      value => value !== valueToRemove
    );
    setSelectedValues(newSelectedValues);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setInputValue('');
      // Focus the input when opening
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to remove the last selected option when input is empty
    if (e.key === 'Backspace' && inputValue === '' && selectedValues.length > 0) {
      handleRemove(selectedValues[selectedValues.length - 1]);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div
        className={`flex flex-wrap items-center w-full px-3 py-2 dark:bg-surface-200 border-border border rounded-sm text-foreground cursor-text min-h-12 ${
          isOpen ? 'ring-2 ring-primary border-transparent shadow-md shadow-primary' : ''
        }`}
        onClick={toggleDropdown}
      >
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-2 mr-2">
            {selectedValues.map(value => {
              const option = options.find(opt => opt.value === value);
              return (
                <div 
                  key={value}
                  className="flex items-center gap-1 bg-gray-200 dark:bg-surface-300 rounded-md px-2 py-1 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{option?.label}</span>
                  <FaX 
                    size={12} 
                    className="cursor-pointer hover:text-red-500" 
                    onClick={(e) => handleRemove(value, e)}
                  />
                </div>
              );
            })}
          </div>
        )}
        <input
          ref={inputRef}
          className={`flex-grow bg-transparent focus:outline-none min-w-20 ${selectedValues.length > 0 ? 'w-auto' : 'w-full'}`}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={selectedValues.length > 0 ? '' : placeholder}
        />
        <FaChevronDown
          size={18}
          className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-surface-200 border border-border rounded-sm shadow-lg max-h-60 overflow-auto">
          {availableOptions.length > 0 ? (
            availableOptions.map((option) => (
              <div
                key={option.value}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-surface-300"
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
