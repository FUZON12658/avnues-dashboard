'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import FileUploader from '@/components/ui/fileuploader';
import { uploadImageApi } from '@/api/uploadImage';

interface JsonFieldProps {
  value: any[];
  onChange: (value: any[]) => void;
  schema: {
    fields: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'file' | 'select';
      options?: Array<{ value: string; label: string }>;
      required?: boolean;
    }>;
  };
  label?: string;
}

const JsonTableEditor: React.FC<JsonFieldProps> = ({
  value = [],
  onChange,
  schema,
  label = 'JSON Data'
}) => {
  // Create a ref to store the current value to avoid re-renders
  const rowsRef = useRef<any[]>(value || []);
  const [rows, setRows] = useState<any[]>(value || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newRow, setNewRow] = useState<any>({});
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Image/file upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: uploadImageApi,
  });

  // Initialize rows only once when component mounts
  useEffect(() => {
    if (!initialized && Array.isArray(value)) {
      rowsRef.current = value;
      setRows(value);
      setInitialized(true);
    }
  }, [value, initialized]);

  // Initialize empty new row based on schema (just once)
  useEffect(() => {
    const defaultRow = schema.fields.reduce((acc, field) => {
      acc[field.key] = field.type === 'number' ? 0 : '';
      return acc;
    }, {} as Record<string, any>);
    
    setNewRow(defaultRow);
  }, [schema]);

  // Update parent component when rows change, but avoid infinite loops
  const updateParent = (newRows: any[]) => {
    // Only call onChange if the values are actually different
    if (JSON.stringify(rowsRef.current) !== JSON.stringify(newRows)) {
      rowsRef.current = newRows;
      onChange(newRows);
    }
  };

  const handleAddRow = async () => {
    // Process any file fields before adding
    const processedRow = {...newRow};
    
    for (const field of schema.fields) {
      if (field.type === 'file' && processedRow[field.key] instanceof File) {
        try {
          const response = await uploadImageMutation.mutateAsync(processedRow[field.key]);
          processedRow[field.key] = response.url;
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }
    }
    
    const newRows = [...rows, processedRow];
    setRows(newRows);
    updateParent(newRows);
    
    // Reset for next entry
    const defaultRow = schema.fields.reduce((acc, field) => {
      acc[field.key] = field.type === 'number' ? 0 : '';
      return acc;
    }, {} as Record<string, any>);
    
    setNewRow(defaultRow);
    setIsAddingRow(false);
  };

  const handleDeleteRow = (index: number) => {
    const updatedRows = [...rows];
    updatedRows.splice(index, 1);
    setRows(updatedRows);
    updateParent(updatedRows);
  };

  const handleEditRow = (index: number) => {
    setEditingIndex(index);
  };

  const handleUpdateRow = async () => {
    if (editingIndex === null) return;
    
    // Process any file fields before updating
    const processedRow = {...rows[editingIndex]};
    
    for (const field of schema.fields) {
      if (field.type === 'file' && processedRow[field.key] instanceof File) {
        try {
          const response = await uploadImageMutation.mutateAsync(processedRow[field.key]);
          processedRow[field.key] = response.url;
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }
    }
    
    const updatedRows = [...rows];
    updatedRows[editingIndex] = processedRow;
    setRows(updatedRows);
    updateParent(updatedRows);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleFieldChange = (index: number | null, key: string, value: any) => {
    if (index === null) {
      // Updating the new row form
      setNewRow({
        ...newRow,
        [key]: value
      });
    } else {
      // Updating an existing row
      const updatedRows = [...rows];
      updatedRows[index] = {
        ...updatedRows[index],
        [key]: value
      };
      setRows(updatedRows);
      // Don't call updateParent here - we'll call it when the edit is committed
    }
  };

  const renderField = (
    field: JsonFieldProps['schema']['fields'][0], 
    index: number | null, 
    rowData: any
  ) => {
    const value = rowData[field.key];
    const isEditing = index === editingIndex || index === null;

    switch (field.type) {
      case 'text':
        return isEditing ? (
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(index, field.key, e.target.value)}
            className="w-full"
          />
        ) : (
          <span>{value || ''}</span>
        );

      case 'number':
        return isEditing ? (
          <Input
            type="number"
            value={value || 0}
            onChange={(e) => handleFieldChange(index, field.key, Number(e.target.value))}
            className="w-full"
          />
        ) : (
          <span>{value}</span>
        );

      case 'file':
        if (isEditing) {
          return typeof value === 'string' && value ? (
            <div className="flex items-center gap-2">
              <img 
                src={value} 
                alt="Icon" 
                className="w-8 h-8 object-contain" 
              />
              <FileUploader
                multiple={false}
                onFilesChange={(files) => {
                  if (files && files.length > 0) {
                    handleFieldChange(index, field.key, files[0]);
                  }
                }}
                buttonText="Change Icon"
                id={`file-upload-${field.key}-${index ?? 'new'}`}
                accept=".png,.jpg,.jpeg,.svg"
              />
            </div>
          ) : (
            <FileUploader
              multiple={false}
              onFilesChange={(files) => {
                if (files && files.length > 0) {
                  handleFieldChange(index, field.key, files[0]);
                }
              }}
              buttonText="Upload Icon"
              id={`file-upload-${field.key}-${index ?? 'new'}`}
              accept=".png,.jpg,.jpeg,.svg"
            />
          );
        } else {
          return value ? (
            <img 
              src={value} 
              alt="Icon" 
              className="w-8 h-8 object-contain" 
            />
          ) : (
            <span>No icon</span>
          );
        }

      case 'select':
        if (isEditing) {
          return (
            <select
              value={value}
              onChange={(e) => handleFieldChange(index, field.key, e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select...</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        } else {
          const option = field.options?.find(opt => opt.value === value);
          return <span>{option?.label || value}</span>;
        }

      default:
        return <span>{value}</span>;
    }
  };

  return (
    <div className="w-full">
      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              {schema.fields.map((field) => (
                <th key={field.key} className="p-2 text-left border-b">
                  {field.label}
                </th>
              ))}
              <th className="p-2 text-center border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {schema.fields.map((field) => (
                  <td key={field.key} className="p-2 border-b">
                    {renderField(field, index, row)}
                  </td>
                ))}
                <td className="p-2 border-b text-center">
                  {editingIndex === index ? (
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={handleUpdateRow}
                        className="text-green-600 hover:text-green-800 hover:bg-green-100"
                      >
                        <Check size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={handleCancelEdit}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleEditRow(index)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDeleteRow(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {isAddingRow && (
              <tr className="bg-blue-50">
                {schema.fields.map((field) => (
                  <td key={field.key} className="p-2 border-b">
                    {renderField(field, null, newRow)}
                  </td>
                ))}
                <td className="p-2 border-b text-center">
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={handleAddRow}
                      className="text-green-600 hover:text-green-800 hover:bg-green-100"
                    >
                      <Check size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsAddingRow(false)}
                      className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            
            {rows.length === 0 && !isAddingRow && (
              <tr>
                <td colSpan={schema.fields.length + 1} className="p-4 text-center text-gray-500">
                  No items added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!isAddingRow && (
        <Button 
          className="mt-4"
          onClick={() => setIsAddingRow(true)}
          variant="ghost"
        >
          <Plus size={16} className="mr-2" /> Add New Item
        </Button>
      )}
    </div>
  );
};

export default JsonTableEditor;