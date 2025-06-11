'use client';
import { crAxios } from '@/api';
import FileUploader from '@/components/ui/fileuploader';
import JsonFormField from '@/components/ui/json-form-field';
import CustomJodit from '@/components/common/CustomJodit';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { capitalizeFirstLetter, formatDateInNepaliTimezone } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  QueryClient,
  useMutation,
  useQueries,
  useQuery,
} from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useParams } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import { toast } from 'sonner';
import { z } from 'zod';
import { BodyText, Heading } from '@/components/common/typography';
import { uploadImageApi } from '@/api/uploadImage';
import MultiSelect from '@/components/ui/multi-select';
import Combobox from '@/components/ui/dropdown-menu';

const isImageFile = (fileNameOrUrl?: string) => {
  if (!fileNameOrUrl || typeof fileNameOrUrl !== 'string') return false; // Ensure it's a valid string

  const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'svg'];

  try {
    const url = new URL(fileNameOrUrl); // Check if it's a valid URL
    const decodedPath = decodeURIComponent(url.pathname.toLowerCase()); // Decode and normalize
    return imageExtensions.some((ext) => decodedPath.endsWith(`.${ext}`));
  } catch (e) {
    // Not a valid URL, treat it as a filename
    const fileExtension = fileNameOrUrl.split('.').pop()?.toLowerCase();
    return fileExtension ? imageExtensions.includes(fileExtension) : false;
  }
};

function formatTitle(title: string) {
  return title
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const getValidationSchema = (fields: any) => {
  const schema = {};
  fields.forEach(
    ({
      key,
      type,
      required,
      allowAny,
    }: {
      key: any;
      type: any;
      required: any;
      allowAny: any;
    }) => {
      let fieldSchema;
      switch (type) {
        case 'text':
          if (allowAny) {
            fieldSchema = z.any();
            break;
          }
          fieldSchema = z.string();
          if (required) fieldSchema = fieldSchema.min(1, `${key} is required`);
          break;
        case 'jsonArray':
          fieldSchema = z
            .array(
              z.object({}).passthrough() // Allow any keys in the object
            )
            .optional();
          if (required) {
            fieldSchema = z
              .array(z.object({}).passthrough())
              .min(1, `At least one ${key} item is required`);
          }
          break;
        case 'htmlfield':
          fieldSchema = z.string();
          if (required) fieldSchema = fieldSchema.min(1, `${key} is required`);
          break;
        case 'file':
          fieldSchema = z.any(); // `File` instance validation may fail in some environments
          break;
        case 'filegallery':
          fieldSchema = z.any(); // `File` instance validation may fail in some environments
          break;
        case 'switch':
          fieldSchema = z.string().optional();
          break;
        case 'number':
          fieldSchema = z.number();
          if (required) fieldSchema = fieldSchema.min(1, `${key} is required`);
          break;
        case 'multiselect':
          fieldSchema = z.any();
          break;
        case 'singleselectstatic':
          fieldSchema = z.any();
          break;
        case 'singleselect':
          fieldSchema = z.any();
          break;
        case 'time':
          fieldSchema = z.string();
          if (required) fieldSchema = fieldSchema.min(1, `${key} is required`);
          break;
        default:
          fieldSchema = z.any();
      }
      //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
      schema[key] = fieldSchema;
    }
  );
  return z.object(schema);
};

interface FormData {
  [key: string]: any;
}

interface DynamicFormProps {
  suppliedId?: string;
  formDataSupplied?: FormData;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  suppliedId,
  formDataSupplied,
}) => {
  const { slug } = useParams();
  const [files, setFiles] = React.useState<Record<string, File[]>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formValues, setFormValues] = React.useState({});
  const queryClient = new QueryClient();
  const [singleSelectStaticOptions, setSingleSelectStaticOptions] =
    React.useState({});
  const [scorecardData, setScorecardData] = React.useState({
    fixtureId: null,
    teamOneId: null,
    teamTwoId: null,
  });

  // Add state to control scorecard upload visibility
  const [showScorecardUpload, setShowScorecardUpload] = React.useState(false);

  // ... (keep all your existing code until the return statement)

  // Add a function to check if all required scorecard data is filled
  const isScoreCardDataComplete = React.useMemo(() => {
    return (
      scorecardData.fixtureId &&
      scorecardData.teamOneId &&
      scorecardData.teamTwoId
    );
  }, [scorecardData]);

  const getDataFromRoute = async (route: string) => {
    const response = await crAxios.get(route);
    return response.data;
  };

  const postDetailsApi = async (data: any) => {
    const response = await crAxios.post(
      `${viewData.displayModel.actions.add.actionRoute}`,
      data
    );
    return response.data;
  };

  const handleFileUpload = (key: string, newFiles: File[]) => {
    setFiles((prev) => ({
      ...prev,
      [key]: newFiles,
    }));
  };

  // Function to get files for a specific key
  const getFilesForKey = (key: string): File[] => {
    return files[key] || [];
  };

  // Function to remove a specific file from a key
  const removeFileFromKey = (key: string, fileIndex: number) => {
    setFiles((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, index) => index !== fileIndex),
    }));
  };

  // Function to clear all files for a specific key
  const clearFilesForKey = (key: string) => {
    setFiles((prev) => ({
      ...prev,
      [key]: [],
    }));
  };

  const putDetailsApi = async (data: any) => {
    const response = await crAxios.put(
      //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
      `${viewData.displayModel.actions.edit.actionRoute}${formDataSupplied.id}`,
      data
    );
    return response.data;
  };

  const getDetailsApi = async (
    limit: number = 1,
    offset: number = 0,
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ) => {
    const response = await crAxios.get(`/api/v1/${slug}`, {
      params: { limit, offset, sort: sortOrder },
    });
    return response.data;
  };

  const putDetailsMutation = useMutation({
    mutationFn: putDetailsApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`${slug}-${suppliedId}-view`],
      });
      queryClient.invalidateQueries({
        queryKey: [`${slug}-view`],
      });
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  const postDetailMutation = useMutation({
    mutationFn: postDetailsApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`${slug}-view`],
      });
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: uploadImageApi,
    onError: () => {
      setIsSubmitting(false);
    },
  });
  const {
    data: viewData,
    isLoading,
    error,
    refetch: viewDataRefetch,
  } = useQuery({
    queryKey: [`${slug}-view`],
    queryFn: () => getDetailsApi(1, 0, 'DESC'),
  });

  const [multiSelectData, setMultiSelectData] = React.useState({});
  const editor = React.useRef<any>(null);

  // Only create validation schema once viewData is available
  const validationSchema = React.useMemo(() => {
    if (!viewData) return null;
    return getValidationSchema(viewData.displayModel.formFields);
  }, [viewData]);

  // Initialize form only after viewData and validation schema are ready
  const form = useForm({
    //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
    resolver: viewData ? zodResolver(validationSchema) : undefined,
    defaultValues: {},
  });

  const dataFilledRef = React.useRef(false);

  React.useEffect(() => {
    if (viewData && !dataFilledRef.current && formDataSupplied) {
      const newDefaultValues = viewData.displayModel.formFields.reduce(
        //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
        (acc, { key, type }) => {
          if (type === 'switch') {
            acc[key] = formDataSupplied?.[key] ? 'Yes' : 'No';
          } else if (type === 'number') {
            acc[key] = formDataSupplied?.[key] ?? 0;
          } else if (type === 'multiselect') {
            const value = formDataSupplied?.[key];
            acc[key] = Array.isArray(value)
              ? value.map((item) =>
                  typeof item === 'object' && item !== null
                    ? item
                    : { label: item, value: item }
                )
              : [];
          } else if (type === 'singleselect') {
            acc[key] = formDataSupplied?.[key] ?? [];
          } else if (type === 'file') {
            acc[key] = formDataSupplied?.[key] ?? null;
          } else if (type === 'filegallery') {
            acc[key] = formDataSupplied?.[key] ?? null;

            // Set files for this specific key
            setFiles((prev) => ({
              ...prev,
              [key]:
                formDataSupplied?.[key] && (formDataSupplied?.[key]).length > 0
                  ? (formDataSupplied?.[key]).map((item: any) => {
                      // If it's already a File object, return it
                      if (item instanceof File) return item;
                      // If it's a URL string, create a placeholder or handle as needed
                      // Note: You might need to handle URL-to-File conversion differently
                      return item.url || item; // Return the URL string for now
                    })
                  : [],
            }));
          } else if (type === 'singleselectstatic') {
            const value = formDataSupplied?.[key];
            acc[key] = value ? { value, label: value } : null;
          } else if (type === 'time') {
            acc[key] = formDataSupplied?.[key] ?? '';
          } else if (type === 'date') {
            const dateValue = formDataSupplied?.[key];
            acc[key] = dateValue
              ? new Date(dateValue).toISOString().split('T')[0]
              : '';
          } else {
            acc[key] = formDataSupplied?.[key] ?? '';
          }
          return acc;
        },
        {}
      );
      console.log(newDefaultValues);
      form.reset(newDefaultValues); // ✅ Dynamically update form values
    }
  }, [viewData, form, formDataSupplied]);

  React.useEffect(() => {
    if (viewData) {
      const staticOptions = {};
      viewData.displayModel.formFields.forEach((field: any) => {
        // Handle singleselectstatic fields
        if (
          field.type === 'singleselectstatic' &&
          Array.isArray(field.values)
        ) {
          //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
          staticOptions[field.key] = field.values.map((value) =>
            value.value
              ? {
                  value: value.value,
                  label: value.label,
                }
              : {
                  value,
                  label: value,
                }
          );
        }

        // Handle static multiselect options provided directly in formFields
        if (field.type === 'multiselect' && Array.isArray(field.options)) {
          //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
          staticOptions[field.key] = field.options;

          // Also add these options to the multiSelectData state
          setMultiSelectData((prev) => ({
            ...prev,
            [field.key]: field.options,
          }));
        }
      });
      setSingleSelectStaticOptions(staticOptions);
    }
  }, [viewData]);

  const multiSelectFields = React.useMemo(
    () =>
      viewData?.displayModel?.formFields?.filter(
        //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
        ({ type, dataRoute, dataToShow, options }) =>
          // Only include fields that need API data fetching
          (type === 'multiselect' || type === 'singleselect') &&
          dataRoute &&
          dataToShow &&
          !options // Skip if it has static options
      ) || [],
    [viewData]
  );

  //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
  const transformQueryData = React.useCallback((data, dataToShow) => {
    if (!data || data.length <= 0 || !dataToShow) return [{}];
    //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
    return data.map((item) => {
      // Get label by joining the specified fields
      //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
      const labelParts = dataToShow.map((field) => {
        // Check if the field is nested
        if (field.includes('.')) {
          return renderNestedValue(item, field);
        }
        if (field === 'date') {
          return formatDateInNepaliTimezone(item[field], false);
        }
        // Otherwise, access it directly
        return item[field] ?? '—';
      });

      const label = labelParts.join(' : ');

      return {
        value: item.id,
        label: label || 'Untitled', // Fallback if no fields are available
      };
    });
  }, []);

  // Helper function to handle nested paths
  //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
  const renderNestedValue = (obj, key) => {
    if (!obj) return '—';

    // Handle nested paths like 'user.fullName' or 'group.groupName'
    const parts = key.split('.');
    let value = obj;

    for (const part of parts) {
      value = value[part];
      if (value === undefined || value === null) return '—';
    }

    return value;
  };
  //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
  const findMatchingOptions = React.useCallback((options, fieldValues) => {
    if (!Array.isArray(fieldValues) || !Array.isArray(options)) return [];
    console.log(JSON.stringify(fieldValues));
    // Extract IDs from fieldValues objects
    let fieldValueIds = fieldValues.map((item) => item.id);
    if (!fieldValueIds[0]) {
      fieldValueIds = fieldValues.map((item) => item.value);
    }
    // Find matching options based on the IDs
    const matchingValues = options.filter((option) =>
      fieldValueIds.includes(option.value)
    );

    return matchingValues;
  }, []);

  const findMatchingOptionsForSingleSelect = React.useCallback(
    //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
    (options, fieldValues) => {
      if (!Array.isArray(options)) return [];
      console.log(JSON.stringify(fieldValues));
      // Extract IDs from fieldValues objects
      let fieldValueIds = fieldValues.id;
      if (!fieldValueIds) {
        fieldValueIds = fieldValues.value;
      }
      // Find matching options based on the IDs
      const matchingValues = options.filter(
        (option) => fieldValueIds === option.value
      );

      console.log('Field Value IDs:', fieldValueIds);
      console.log('Matching Values:', matchingValues);

      return matchingValues;
    },
    [slug]
  );
  // Check if all fields have data
  const isDataComplete = React.useCallback(
    (data: any) => {
      if (!multiSelectFields.length) return false;
      return multiSelectFields.every(
        (field: any) => data[field.key] && data[field.key].length > 0
      );
    },
    [multiSelectFields]
  );

  const handleDataUpdate = React.useCallback(
    (key: any, transformedData: any) => {
      console.log('Iam being triggered af');
      setMultiSelectData((prev) => {
        const newData = {
          ...prev,
          [key]: transformedData,
        };

        // If all fields have data, mark as filled
        if (isDataComplete(newData)) {
          dataFilledRef.current = true;
        }

        return newData;
      });
    },
    [isDataComplete]
  );

  React.useEffect(() => {
    console.log('reached here baagagaman');
    console.log(multiSelectData);
  }, [multiSelectData]);

  const queriesConfig = React.useMemo(
    () =>
      //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
      multiSelectFields.map(({ key, dataRoute, dataToShow }) => ({
        queryKey: [`${slug}-${key}-data`],
        queryFn: () => {
          console.log('Fetching data from:', dataRoute);
          return getDataFromRoute(dataRoute);
        },
        enabled: !!viewData && !!dataRoute && !dataFilledRef.current,
        staleTime: Infinity,
        onSuccess: (data: any) => {
          if (!data || dataFilledRef.current) return;
          const transformedData = transformQueryData(data.mainData, dataToShow);
          handleDataUpdate(key, transformedData);
        },
      })),
    [multiSelectFields, slug, viewData, transformQueryData, handleDataUpdate]
  );

  const multiSelectQueries = useQueries({ queries: queriesConfig });
  // Only update when not already filled
  React.useEffect(() => {
    console.log('entered here');
    if (dataFilledRef.current) {
      console.log('Data already filled, skipping update');
      return;
    }

    const allQueriesSuccessful = multiSelectQueries.every(
      (query) => query.isSuccess && query.data
    );

    if (allQueriesSuccessful && viewData) {
      //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
      const newData = multiSelectFields.reduce((acc, field, index) => {
        //@ts-ignore
        const queryData = multiSelectQueries[index].data.mainData;
        if (queryData) {
          acc[field.key] = transformQueryData(queryData, field.dataToShow);
        }
        return acc;
      }, {});

      if (isDataComplete(newData)) {
        dataFilledRef.current = true;
        setMultiSelectData(newData);
        console.log('Data filled completely:', newData);
      }
    }
  }, [
    multiSelectQueries,
    multiSelectFields,
    viewData,
    transformQueryData,
    isDataComplete,
  ]);
  //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      let processedData = { ...data };
      console.log(processedData);
      // Get field types from viewData
      const fieldTypes = viewData.displayModel.formFields.reduce(
        //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
        (acc, field) => {
          acc[field.key] = field.type;
          return acc;
        },
        {}
      );

      // Process all fields based on their types
      for (let [key, value] of Object.entries(processedData)) {
        const fieldType = fieldTypes[key];

        // Handle file uploads
        if (fieldType === 'file' && value instanceof File) {
          const uploadResponse = await uploadImageMutation.mutateAsync(value);
          processedData[key] = uploadResponse.url;
        }

        if (fieldType === 'scorecard') {
          delete processedData[key];
        }

        if (fieldType === 'jsonArray' && Array.isArray(value)) {
          // Process any file uploads within the array items
          processedData[key] = await Promise.all(
            value.map(async (item) => {
              const processedItem = { ...item };
              // If item has an icon field and it's a File object, upload it
              if (item.icon instanceof File) {
                const uploadResponse = await uploadImageMutation.mutateAsync(
                  item.icon
                );
                processedItem.icon = uploadResponse.url;
              }
              return processedItem;
            })
          );
        }
        if (fieldType === 'filegallery') {
          const currentFiles = files[key]; // Get files for this specific key
          if (!currentFiles || currentFiles.length === 0) return;

          let valuesArray: (File | string)[];
          if (Array.isArray(currentFiles)) {
            valuesArray = currentFiles;
          } else {
            throw new Error('Invalid value type for filegallery');
          }

          const uploadedUrls = await Promise.all(
            valuesArray.map(async (item) => {
              if (item instanceof File) {
                const uploadResponse = await uploadImageMutation.mutateAsync(
                  item
                );
                return uploadResponse.url;
              }
              return item; // It's already a URL string
            })
          );

          processedData[key] = uploadedUrls;
        }
        // Handle multiselect fields
        if (
          fieldType === 'multiselect' &&
          Array.isArray(value) &&
          value.length > 0 &&
          (value[0]?.value || value[0]?.id)
        ) {
          if (processedData[key] && processedData[key].length > 0) {
            processedData[key] = value.map((item) => item.value || item.id);
          } else {
            processedData[key] = null;
          }
          // Extract just the value from each selected option
        }
        if (
          fieldType === 'singleselect' &&
          value &&
          typeof value === 'object' &&
          'id' in value
        ) {
          processedData[key] = value.id;
        }
        if (fieldType === 'singleselect') {
          if (value && typeof value === 'object' && 'value' in value) {
            processedData[key] = value.value;
          } else if (value) {
            processedData[key] = value;
          } else{
            processedData[key] = null;
          }
        }

        if (fieldType === 'switch') {
          processedData[key] = value === 'Yes';
        }

        if (fieldType === 'date' && typeof value === 'string') {
          console.log('date magaman');
          console.log(value);

          // Since value is already a Date object, just convert it to UTC ISO string
          processedData[key] = new Date(value).toISOString(); // This gives you the UTC date in ISO 8601 format
        }
        if (
          fieldType === 'singleselectstatic' &&
          value &&
          typeof value === 'object' &&
          'value' in value
        ) {
          processedData[key] = value.value;
        }
      }

      console.log('final Data here');
      console.log(processedData);
      if (formDataSupplied) {
        await putDetailsMutation.mutateAsync(processedData);
        toast.success('Item updated successfully');
        setIsSubmitting(false);
      } else {
        await postDetailMutation.mutateAsync(processedData);
        toast.success('Item created successfully');
        setIsSubmitting(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('Form submission error:', error);
      toast.error('An error occurred when saving the data');
    }
  };

  const handleSelectChange = (selected: any, field: any) => {
    const currentValues = field.value?.selectedValues || [];
    let newValues;

    if (selected.length > currentValues.length) {
      // Adding a new value
      const newOption = selected[selected.length - 1];
      newValues = [...currentValues, newOption.value];
    } else {
      // Removing a value
      const removedOption = currentValues.find(
        (value: any) => !selected.map((s: any) => s.value).includes(value)
      );
      newValues = currentValues.filter((value: any) => value !== removedOption);
    }

    field.onChange({
      ...field.value,
      selectedValues: newValues,
    });
  };

  // React.useEffect(() => {
  //   const subscription = form.watch((values) => {
  //     setFormValues(values);
  //   });
  //   return () => subscription.unsubscribe();
  // }, [form]);
  console.log(viewData);

  const findMatchingOptionsMemo = React.useMemo(() => {
    return (options, fieldValues) => {
      if (!Array.isArray(fieldValues) || !Array.isArray(options)) return [];

      let fieldValueIds = fieldValues.map((item) => item.id);
      if (!fieldValueIds[0]) {
        fieldValueIds = fieldValues.map((item) => item.value);
      }

      return options.filter((option) => fieldValueIds.includes(option.value));
    };
  }, []);

  // 4. ALTERNATIVE: If you need to memoize specific calls, do it at call site
  const useMemoizedMatchingOptions = (options, fieldValues) => {
    return React.useMemo(() => {
      if (!Array.isArray(fieldValues) || !Array.isArray(options)) return [];

      let fieldValueIds = fieldValues.map((item) => item.id);
      if (!fieldValueIds[0]) {
        fieldValueIds = fieldValues.map((item) => item.value);
      }

      return options.filter((option) => fieldValueIds.includes(option.value));
    }, [options, fieldValues]); // Memoize based on actual inputs
  };

  return (
    viewData && (
      <div className="flex flex-col w-full h-full">
        <Heading variant="h2" className="w-full px-10 mt-6">
          {formDataSupplied
            ? `Edit ${String(
                capitalizeFirstLetter(
                  viewData.displayModel.dashboardConfig.header.entity
                )
              )}`
            : `Add ${String(
                capitalizeFirstLetter(
                  viewData.displayModel.dashboardConfig.header.entity
                )
              )}`}
        </Heading>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 w-full px-10 pb-20 mt-4"
          >
            {viewData &&
              viewData.displayModel.formFields.map(
                ({
                  key,
                  label,
                  type,
                  disabled,
                  required,
                  schema,
                }: {
                  key: string;
                  label: string;
                  type: string;
                  disabled?: boolean;
                  required?: boolean;
                  schema?: any;
                }) => (
                  <FormField
                    control={form.control}
                    key={key}
                    //@ts-ignore
                    name={key}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <BodyText variant="trimmed"> {label}</BodyText>
                        </FormLabel>
                        <FormControl className="w-[21.75rem]">
                          <div className="min-w-full">
                            {type === 'text' && (
                              <Input
                                className="border p-2 w-full"
                                disabled={disabled ?? false}
                                {...field}
                              />
                            )}
                            {type === 'time' && (
                              <Input
                                type="time"
                                className="border p-2 w-full"
                                disabled={disabled ?? false}
                                {...field}
                              />
                            )}
                            {type === 'date' && (
                              <Input
                                type="date"
                                className="border p-2 w-full"
                                disabled={disabled ?? false}
                                {...field}
                              />
                            )}
                            {type === 'htmlfield' && (
                              // <ZoditEditor value={watch(key) || ""} onChange={(content) => setValue(key, content)} />
                              <div className="w-[798px] -ml-2 mr-auto">
                                <CustomJodit
                                  ref={editor}
                                  onChange={field.onChange}
                                  value={field.value}
                                  variable="blogPreview"
                                  editorStyles="max-width:805px !important;"
                                />
                              </div>
                            )}
                            {type === 'multiselect' &&
                              React.useMemo(() => {
                                const fieldOptions = multiSelectData[key] || [];

                                const fieldDefaultValues = (() => {
                                  const fieldValues = field.value || [];
                                  if (
                                    !Array.isArray(fieldValues) ||
                                    !Array.isArray(fieldOptions)
                                  )
                                    return [];

                                  let fieldValueIds = fieldValues.map(
                                    (item) => item.id
                                  );
                                  if (!fieldValueIds[0]) {
                                    fieldValueIds = fieldValues.map(
                                      (item) => item.value
                                    );
                                  }

                                  return fieldOptions.filter((option) =>
                                    fieldValueIds.includes(option.value)
                                  );
                                })();

                                return (
                                  <MultiSelect
                                    key={`${key}-${fieldOptions.length}`} // Add options length to key to force re-render when options change
                                    options={fieldOptions}
                                    className="basic-multi-select"
                                    placeholder="Select "
                                    defaultValues={fieldDefaultValues}
                                    onChange={field.onChange}
                                  />
                                );
                              }, [
                                multiSelectData[key],
                                field.value,
                                field.onChange,
                                key,
                              ])}
                            {/* {type === 'singleselect' && (() => {
                            // Memoize options calculation
                            const fieldOptions = React.useMemo(() => {
                              const allOptions = multiSelectData[key] || [];

                              // Check if this field has sync property
                              if (schema?.property === 'sync' && schema?.id) {
                                // Find all other fields with the same sync ID
                                const relatedFields = viewData.displayModel.formFields.filter(
                                  (f: any) =>
                                    f.type === 'singleselect' &&
                                    f.schema?.id === schema.id &&
                                    f.schema?.property === 'sync' &&
                                    f.key !== key
                                );
                                
                                const valuesToExclude: any[] = [];
                                relatedFields.forEach((relatedField: any) => {
                                  const relatedValue = formValues[relatedField.key];

                                  if (relatedValue) {
                                    // Handle both object values and direct values
                                    if (typeof relatedValue === 'object' && relatedValue !== null) {
                                      if (relatedValue.value) {
                                        valuesToExclude.push(relatedValue.value);
                                      }
                                    } else {
                                      valuesToExclude.push(relatedValue);
                                    }
                                  }
                                });

                                // Return filtered options
                                return allOptions.filter(
                                  (option: any) => !valuesToExclude.includes(option.value)
                                );
                              }

                              // No sync needed, return all options
                              return allOptions;
                            }, [multiSelectData[key], formValues, schema, viewData.displayModel.formFields]);

                            // Memoize default value calculation
                            const fieldDefaultValue = React.useMemo(() => {
                              const fieldValue = field.value || [];
                              if (!Array.isArray(fieldOptions)) return [];
                              
                              // Extract IDs from fieldValues objects
                              let fieldValueIds = fieldValue.id;
                              if (!fieldValueIds) {
                                fieldValueIds = fieldValue.value;
                              }
                              
                              // Find matching options based on the IDs
                              const matchingValues = fieldOptions.filter(
                                (option: any) => fieldValueIds === option.value
                              );

                              return matchingValues;
                            }, [fieldOptions, field.value]);

                            return (
                              <Combobox
                                key={key}
                                options={fieldOptions}
                                className="basic-select"
                                defaultValue={fieldDefaultValue}
                                onChange={(selected) => {
                                  console.log(`Field ${key} selected:`, selected);
                                  field.onChange(selected);
                                }}
                              />
                            );
                          })()} */}
                            {type === 'singleselect' &&
                              React.useMemo(() => {
                                const fieldOptions = multiSelectData[key] || [];

                                const fieldDefaultValue = (() => {
                                  const fieldValue = field.value;
                                  if (
                                    !fieldValue ||
                                    !Array.isArray(fieldOptions)
                                  )
                                    return null;

                                  let fieldValueId = fieldValue.id;
                                  if (!fieldValueId) {
                                    fieldValueId = fieldValue.value;
                                  }

                                  return (
                                    fieldOptions.find(
                                      (option) => option.value === fieldValueId
                                    ) || null
                                  );
                                })();

                                return (
                                  <Combobox
                                    key={`${key}-${fieldOptions.length}`}
                                    options={fieldOptions}
                                    className="basic-single-select"
                                    placeholder="Select "
                                    defaultValue={fieldDefaultValue}
                                    onChange={field.onChange}
                                  />
                                );
                              }, [
                                multiSelectData[key],
                                field.value,
                                field.onChange,
                                key,
                              ])}
                            {type === 'filegallery' && (
                              <div className="p-4" key={key}>
                                <FileUploader
                                  multiple={true}
                                  files={getFilesForKey(key)} // Pass files for this specific key
                                  onFilesChange={(newFiles) => {
                                    //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                                    handleFileUpload(key, newFiles);
                                  }}
                                  buttonText="Upload Files"
                                  id={`file-gallery-upload-${key}`}
                                  accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.docx"
                                  label={label || 'Upload Files'}
                                />
                              </div>
                            )}
                            {type === 'singleselectstatic' && (
                              <Combobox
                                key={key}
                                // isDisabled={disabled ?? false}
                                //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                                options={singleSelectStaticOptions[key] || []}
                                className="basic-select"
                                defaultValue={field.value}
                                onChange={(selected) => {
                                  field.onChange(selected);
                                }}
                                placeholder="Select an option..."
                              />
                            )}
                            {type === 'jsonArray' && (
                              <JsonFormField
                                field={field}
                                label={label}
                                schema={schema}
                                required={required}
                                disabled={disabled}
                              />
                            )}
                            {type === 'file' &&
                              (!field.value ? (
                                <FileUploader
                                  multiple={false}
                                  onFilesChange={(files) => {
                                    // Update field with the first file since multiple is false
                                    if (files && files.length > 0) {
                                      field.onChange(files[0]);
                                    } else {
                                      field.onChange(null);
                                    }
                                  }}
                                  buttonText="Upload File"
                                  id={`file-upload-${field.name}`}
                                  // {...props.accept && { accept: props.accept }}
                                />
                              ) : (
                                <div className="mt-2 relative min-w-[5.25rem] min-h-[5.25rem] flex items-center gap-2">
                                  <X
                                    className="m-1 absolute top-0 left-0 w-6 h-6 text-red-500 hover:text-red-700 cursor-pointer"
                                    onClick={() => field.onChange(null)}
                                  />
                                  {typeof field.value === 'string' ? (
                                    // If value is a URL
                                    isImageFile(field.value) ? (
                                      <img
                                        src={field.value}
                                        alt="Uploaded"
                                        className="max-w-full max-h-32 rounded-md bg-black"
                                      />
                                    ) : (
                                      <a
                                        href={field.value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 underline"
                                      >
                                        Open File
                                      </a>
                                    )
                                  ) : // If value is a File instance
                                  //@ts-ignore
                                  isImageFile(field.value.name) ? (
                                    <img
                                      src={URL.createObjectURL(field.value)}
                                      alt="Uploaded"
                                      className="max-w-full max-h-32 rounded-md"
                                    />
                                  ) : (
                                    <a
                                      href={URL.createObjectURL(field.value)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 underline"
                                    >
                                      Open File
                                    </a>
                                  )}
                                </div>
                              ))}
                            {type === 'switch' && (
                              <Switch
                                id={key}
                                value={field?.value || 'No'}
                                label=""
                                onChange={(value: any) => {
                                  field.onChange(value);
                                }}
                              />
                            )}
                            {type === 'number' && (
                              <Input
                                type="number"
                                {...field}
                                className="border p-2 w-full bg-gray-200"
                                disabled={disabled ?? false}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            )}
                            {type === 'textarea' && (
                              <Textarea
                                {...field}
                                className="border p-2 w-full"
                                disabled={disabled ?? false}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            )}{' '}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              )}
            <Button
              type="submit"
              className="text-white relative p-2 rounded"
              disabled={
                putDetailsMutation.isPending ||
                postDetailMutation.isPending ||
                isSubmitting
              }
            >
              {putDetailsMutation.isPending ||
              postDetailMutation.isPending ||
              isSubmitting
                ? 'Please Wait...'
                : 'Submit'}
            </Button>
          </form>
        </Form>
      </div>
    )
  );
};
