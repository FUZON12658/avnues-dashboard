"use client"

import React, { useState, useEffect } from 'react';
import { BodyText } from '../common/typography';

interface SwitchProps {
    id: string;
    onChange?: (value: string) => void;
    value: string;
    label: string;
    className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ id, onChange = () => {}, value, label, className }) => {
    const [isChecked, setIsChecked] = useState(value === 'Yes');

    useEffect(() => {
        setIsChecked(value === 'Yes');
    }, [value]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = event.target.checked;
        setIsChecked(newChecked);
        onChange(newChecked ? 'Yes' : 'No');
    };

    return (
        <label htmlFor={id} className={`flex items-center gap-2 cursor-pointer ${className}`}>
            <input
                type="checkbox"
                id={id}
                checked={isChecked}
                onChange={handleChange}
                className="sr-only peer"
            />
            <div
                className="relative w-full max-w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-200 dark:peer-focus:ring-green-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#07A04B]"
            ></div>
            <BodyText variant='trimmed'>
                {label}
            </BodyText>
        </label>
    );
};

