'use client';

import React from 'react';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

interface JsonFormFieldProps {
  field: any;
  label: string;
  schema: {
    fields: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'file' | 'select';
      options?: Array<{ value: string; label: string }>;
      required?: boolean;
    }>;
  };
  required?: boolean;
  disabled?: boolean;
}

// Create a wrapper component that can safely receive the data-slot prop
const JsonEditorWrapper = React.forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement> & { value: any; onChange: any; schema: any; label: string }
>((props, ref) => {
  const { value, onChange, schema, label, ...rest } = props;
  
  // We're importing JsonTableEditor dynamically to break the rendering loop
  const [JsonTableEditor, setJsonTableEditor] = React.useState<any>(null);
  
  React.useEffect(() => {
    // Dynamically import the component to prevent circular dependencies
    import('./json-table-editor').then(module => {
      setJsonTableEditor(() => module.default);
    });
  }, []);
  
  if (!JsonTableEditor) {
    return <div ref={ref} {...rest}>Loading editor...</div>;
  }
  
  return (
    <div ref={ref} {...rest}>
      <JsonTableEditor
        value={value}
        onChange={onChange}
        schema={schema}
        label={label}
      />
    </div>
  );
});
JsonEditorWrapper.displayName = 'JsonEditorWrapper';

const JsonFormField: React.FC<JsonFormFieldProps> = ({
  field,
  label,
  schema,
  required = false,
  disabled = false,
}) => {
  return (

        <JsonEditorWrapper
          value={field.value || []}
          onChange={field.onChange}
          schema={schema}
          label={label}
        />
  );
};

export default JsonFormField;