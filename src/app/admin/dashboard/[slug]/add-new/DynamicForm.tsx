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
import {
  CustomAccordion,
  CustomAccordionItem,
  CustomAccordionTrigger,
  CustomAccordionContent,
  CustomTabs,
  CustomTabsList,
  CustomTabsTrigger,
  CustomTabsContent,
} from '@/components/ui/custom-tab';
import { HugeiconsIcon } from '@hugeicons/react';
import { SentIcon } from '@hugeicons/core-free-icons';
import { EnhancedFileUploader } from '@/components/filemanager/file-picker-modal';

interface NestedFieldConfig {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  disabled?: boolean;
  tabId?: string;
  tabName?: string;
  expandableSectionId?: string;
  expandableSectionName?: string;
  // New properties for nested handling
  children?: NestedFieldConfig[];
  isNested?: boolean;
  parentPath?: string;
  nestingLevel?: number;
  containerType?: 'object' | 'array';
  arrayConfig?: {
    minItems?: number;
    maxItems?: number;
    addButtonText?: string;
    removeButtonText?: string;
  };
}

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
      label,
      type,
      required,
      allowAny,
    }: {
      key: any;
      label: any;
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
          if (required)
            fieldSchema = fieldSchema.min(1, `${label} is required`);
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
              .min(1, `At least one ${label} item is required`);
          }
          break;
        case 'htmlfield':
          fieldSchema = z.string();
          if (required)
            fieldSchema = fieldSchema.min(1, `${label} is required`);
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
          if (required)
            fieldSchema = fieldSchema.min(1, `${label} is required`);
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
          if (required)
            fieldSchema = fieldSchema.min(1, `${label} is required`);
          break;
        case 'date':
          fieldSchema = z.string();
          if (required)
            fieldSchema = fieldSchema.min(1, `${label} is required`);
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
  suppliedId?: string | null;
  fixedParents?: any;
  formDataSupplied?: FormData;
}

// Helper function to check if field is a fixed parent
const isFixedParentField = (fieldKey: any, fixedParents: any[]) => {
  return fixedParents?.some((parent) => parent.key === fieldKey) || false;
};

// Helper function to get fixed parent data for a field
const getFixedParentData = (fieldKey: string, fixedParents: any[]) => {
  return fixedParents?.find((parent) => parent.key === fieldKey)?.details;
};

export const DynamicForm: React.FC<DynamicFormProps> = ({
  suppliedId,
  fixedParents,
  formDataSupplied,
}) => {
  console.log(fixedParents);
  const { slug } = useParams();
  const [files, setFiles] = React.useState<Record<string, File[]>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formReady, setFormReady] = React.useState({});
  const queryClient = new QueryClient();
  const [singleSelectStaticOptions, setSingleSelectStaticOptions] =
    React.useState({});
  const [scorecardData, setScorecardData] = React.useState({
    fixtureId: null,
    teamOneId: null,
    teamTwoId: null,
  });
  const [arrayItemsState, setArrayItemsState] = React.useState<
    Record<string, number[]>
  >({});

  const getArrayItems = (path: string): number[] => {
    return arrayItemsState[path] || [0];
  };

  // Helper function to update array items for a specific field path
  const updateArrayItems = (path: string, items: number[]) => {
    setArrayItemsState((prev) => ({
      ...prev,
      [path]: items,
    }));
  };

  const processLink = (link: string, item: any | null): string => {
    let processedLink = link;

    if (item !== null && item.id !== undefined) {
      processedLink = processedLink.replace('{id}', item.id.toString());
    } else if (suppliedId !== null && suppliedId !== undefined) {
      processedLink = processedLink.replace('{id}', suppliedId.toString());
    }

    if (slug !== undefined) {
      processedLink = processedLink.replace('{slug}', slug.toString());
    }

    return processedLink;
  };

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
        (acc, { key, type, populatedKey }) => {
          if (type === 'switch') {
            acc[key] = formDataSupplied?.[key] ? 'Yes' : 'No';
          } else if (type === 'number') {
            acc[key] = formDataSupplied?.[key] ?? 0;
          } else if (type === 'multiselect') {
            const value = formDataSupplied?.[key]
              ? formDataSupplied?.[populatedKey]
                ? formDataSupplied?.[populatedKey]
                : formDataSupplied?.[key]
              : null;
            console.log(value);
            // Handle both array (multiselect) and single values (single select)
            if (Array.isArray(value)) {
              // For multiselect - process array
              const dataToPass = value.map((item) =>
                typeof item === 'object' && item !== null
                  ? item
                  : { label: item, value: item }
              );
              console.log(dataToPass);
              acc[key] = dataToPass;
              console.log('successfully passed the data');
              console.log(acc[key]);
            } else if (value !== null) {
              // For single select - process single value

              acc[key] =
                typeof value === 'object' && value !== null
                  ? value
                  : { label: value, value: value };
            } else {
              // No value provided
              acc[key] = null;
            }
          } else if (type === 'singleselect') {
            acc[key] = formDataSupplied?.[key]
              ? formDataSupplied?.[populatedKey]
                ? formDataSupplied?.[populatedKey]
                : formDataSupplied?.[key]
              : null;
          } else if (type === 'file') {
            // For file fields, use populatedKey if available, otherwise fall back to key
            const dataKey = populatedKey || key;
            acc[key] = formDataSupplied?.[dataKey] || null;
            console.log(
              `File field ${key}: using ${dataKey}, value:`,
              acc[key]
            );
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
      if (newDefaultValues) {
        setFormReady(newDefaultValues);
      }
    }
  }, [viewData, form, formDataSupplied]);

  // React.useEffect(() => {
  //   if (viewData) {
  //     const staticOptions = {};
  //     viewData.displayModel.formFields.forEach((field: any) => {
  //       // Handle singleselectstatic fields
  //       if (
  //         field.type === 'singleselectstatic' &&
  //         Array.isArray(field.values)
  //       ) {
  //         //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
  //         staticOptions[field.key] = field.values.map((value) =>
  //           value.value
  //             ? {
  //                 value: value.value,
  //                 label: value.label,
  //               }
  //             : {
  //                 value,
  //                 label: value,
  //               }
  //         );
  //       }

  //       // Handle static multiselect options provided directly in formFields
  //       if (field.type === 'multiselect' && Array.isArray(field.options)) {
  //         //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
  //         staticOptions[field.key] = field.options;

  //         // Also add these options to the multiSelectData state
  //         setMultiSelectData((prev) => ({
  //           ...prev,
  //           [field.key]: field.options,
  //         }));
  //       }
  //     });
  //     setSingleSelectStaticOptions(staticOptions);
  //   }
  // }, [viewData]);

  React.useEffect(() => {
    if (viewData) {
      const staticOptions = {};

      const processFields = (fields: any) => {
        if (!fields || !Array.isArray(fields)) return;

        fields.forEach((field) => {
          // Handle singleselectstatic fields
          console.log('Here single select static');
          console.log(field);
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

          // Recursively process children
          if (field.children && Array.isArray(field.children)) {
            processFields(field.children);
          }
        });
      };

      processFields(viewData.displayModel.formFields);
      setSingleSelectStaticOptions(staticOptions);
    }
  }, [viewData]);

  React.useEffect(() => {
    console.log('single select aagaman');
    console.log(singleSelectStaticOptions);
  }, [singleSelectStaticOptions]);

  const multiSelectFields = React.useMemo(() => {
    const collectMultiSelectFields = (fields: any) => {
      //@ts-ignore
      const result = [];
      //@ts-ignore
      if (!fields || !Array.isArray(fields)) return result;

      fields.forEach((field) => {
        // Check current field
        if (
          (field.type === 'multiselect' || field.type === 'singleselect') &&
          field.dataRoute &&
          field.dataToShow // Skip if it has static options
        ) {
          result.push(field);
        }

        // Recursively check children
        if (field.children && Array.isArray(field.children)) {
          result.push(...collectMultiSelectFields(field.children));
        }
      });
      //@ts-ignore
      return result;
    };

    return collectMultiSelectFields(viewData?.displayModel?.formFields || []);
  }, [viewData]);

  const multiSelectStatic = React.useMemo(() => {
    const collectStaticMultiSelectFields = (fields: any) => {
      //@ts-ignore
      const result = {};
      //@ts-ignore
      if (!fields || !Array.isArray(fields)) return result;

      fields.forEach((field) => {
        // Check current field - only static options (with Values array)
        if (
          (field.type === 'multiselect' || field.type === 'singleselect') &&
          field.values &&
          Array.isArray(field.values) &&
          field.values.length > 0
        ) {
          // Transform the static options to match your expected format
          const staticOptions = field.values.map((option: any) => ({
            value: option.value || option.Value, // Handle both lowercase and uppercase
            label: option.label || option.Label,
          }));

          //@ts-ignore
          result[field.key] = staticOptions;
        }

        // Recursively check children
        if (field.children && Array.isArray(field.children)) {
          const childStaticFields = collectStaticMultiSelectFields(
            field.children
          );
          Object.assign(result, childStaticFields);
        }
      });

      return result;
    };

    return collectStaticMultiSelectFields(
      viewData?.displayModel?.formFields || []
    );
  }, [viewData]);

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

      return matchingValues[0];
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
    console.log(multiSelectFields);
  }, [multiSelectFields]);

  const queriesConfig = React.useMemo(
    () =>
      multiSelectFields.map(({ key, dataRoute, dataToShow }) => ({
        queryKey: [`${slug}-${key}-data`],
        queryFn: () => {
          console.log('Fetching data from:', dataRoute);
          return getDataFromRoute(processLink(dataRoute, null));
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

  const transformFormDataToNested = (
    formData: any,
    fieldConfig: NestedFieldConfig[]
  ): any => {
    const result = {};

    const processField = (
      field: NestedFieldConfig,
      data: any,
      currentResult: any
    ) => {
      if (field.children && field.children.length > 0) {
        if (field.containerType === 'array') {
          // Handle array fields
          const arrayData = [];
          let index = 0;

          // Find all array indices in the form data
          while (
            data[`${field.key}[${index}]`] !== undefined ||
            Object.keys(data).some((key) =>
              key.startsWith(`${field.key}[${index}].`)
            )
          ) {
            const itemData = {};

            field.children.forEach((childField) => {
              const childKey = `${field.key}[${index}].${childField.key}`;
              if (data[childKey] !== undefined) {
                if (childField.children) {
                  processField(childField, data, itemData);
                } else {
                  //@ts-ignore
                  itemData[childField.key] = data[childKey];
                }
              }
            });

            if (Object.keys(itemData).length > 0) {
              arrayData.push(itemData);
            }
            index++;
          }

          if (arrayData.length > 0) {
            currentResult[field.key] = arrayData;
          }
        } else {
          // Handle object fields
          const objectData = {};
          field.children.forEach((childField) => {
            const childKey = `${field.key}.${childField.key}`;
            if (data[childKey] !== undefined) {
              if (childField.children) {
                processField(childField, data, objectData);
              } else {
                //@ts-ignore
                objectData[childField.key] = data[childKey];
              }
            }
          });

          if (Object.keys(objectData).length > 0) {
            currentResult[field.key] = objectData;
          }
        }
      } else {
        // Simple field
        if (data[field.key] !== undefined) {
          currentResult[field.key] = data[field.key];
        }
      }
    };

    fieldConfig.forEach((field) => processField(field, formData, result));

    // Add any simple fields that aren't nested
    Object.keys(formData).forEach((key) => {
      //@ts-ignore
      if (
        !key.includes('.') &&
        !key.includes('[') &&
        //@ts-ignore
        result[key] === undefined
      ) {
        //@ts-ignore
        result[key] = formData[key];
      }
    });

    return result;
  };

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
        if (
          fieldType === 'file' &&
          typeof value === 'object' &&
          value !== null
        ) {
          //@ts-ignore
          processedData[key] = value.id;
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
          } else {
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
        toast.success(
          `${viewData.displayModel.dashboardConfig.header.entity} updated successfully`
        );
        setIsSubmitting(false);
      } else {
        await postDetailMutation.mutateAsync(processedData);
        toast.success(
          `${viewData.displayModel.dashboardConfig.header.entity} created successfully`
        );
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
    //@ts-ignore
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
  //@ts-ignore
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
  // const organizeFields = (formFields: any) => {
  //   const tabs = {};
  //   const ungroupedFields: any[] = [];
  //   //@ts-ignore
  //   formFields.forEach((field) => {
  //     if (field.tabId) {
  //       // Initialize tab if it doesn't exist
  //       //@ts-ignore
  //       if (!tabs[field.tabId]) {
  //         //@ts-ignore
  //         tabs[field.tabId] = {
  //           id: field.tabId,
  //           name: field.tabName || `${field.tabId}`,
  //           sections: {},
  //           ungroupedFields: [],
  //         };
  //       }

  //       if (field.expandableSectionId) {
  //         // Initialize section within tab if it doesn't exist
  //         //@ts-ignore
  //         if (!tabs[field.tabId].sections[field.expandableSectionId]) {
  //           //@ts-ignore
  //           tabs[field.tabId].sections[field.expandableSectionId] = {
  //             id: field.expandableSectionId,
  //             name:
  //               field.expandableSectionName || `${field.expandableSectionId}`,
  //             fields: [],
  //           };
  //         }
  //         // Add field to section within tab
  //         //@ts-ignore
  //         tabs[field.tabId].sections[field.expandableSectionId].fields.push(
  //           field
  //         );
  //       } else {
  //         // Add field directly to tab (ungrouped within tab)
  //         //@ts-ignore
  //         tabs[field.tabId].ungroupedFields.push(field);
  //       }
  //     } else if (field.expandableSectionId) {
  //       // Fields with section but no tab - treat as ungrouped at top level
  //       // (or you could create a default tab for these)
  //       ungroupedFields.push(field);
  //     } else {
  //       // Fields with neither tab nor section
  //       ungroupedFields.push(field);
  //     }
  //   });
  //   //@ts-ignore
  //   return { tabs, ungroupedFields };
  // };

  // Original field rendering function (keeping all your existing logic)
  const renderFormField = (field: any) => {
    const isFixedParent = isFixedParentField(field.key, fixedParents);
    const parentData = getFixedParentData(field.key, fixedParents);
    console.log(JSON.stringify(parentData));
    return (
      <FormField
        control={form.control}
        key={field.key}
        //@ts-ignore
        name={field.key}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              <BodyText variant="trimmed"> {field.label}</BodyText>
              {field.required && (
                <span className="text-red-500 ml-1 text-xl font-bold">*</span>
              )}
            </FormLabel>
            <FormControl className="">
              <div className="min-w-full">
                {field.type === 'text' && (
                  <Input
                    className="border p-2 w-full"
                    disabled={isFixedParent || field.disabled}
                    {...formField}
                  />
                )}
                {field.type === 'time' && (
                  <Input
                    type="time"
                    className="border p-2 w-full"
                    disabled={isFixedParent || field.disabled}
                    {...formField}
                  />
                )}
                {field.type === 'date' && (
                  <Input
                    type="date"
                    className="border p-2 w-full"
                    disabled={isFixedParent || field.disabled}
                    {...formField}
                  />
                )}
                {field.type === 'htmlfield' && (
                  <div className="w-full -ml-2 mr-auto">
                    <CustomJodit
                      ref={editor}
                      onChange={formField.onChange}
                      value={formField.value}
                      variable="blogPreview"
                      editorStyles="min-width:100% !important;"
                    />
                  </div>
                )}
                {field.type === 'multiselect' &&
                  React.useMemo(() => {
                    //@ts-ignore
                    const fieldOptions = field.key
                      ? //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                        multiSelectData[field.key] ||
                        //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                        multiSelectData[field.key.split('.').pop()!] ||
                        []
                      : [];

                    const fieldDefaultValues = (() => {
                      //@ts-ignore
                      const fieldValues =
                        //@ts-ignore
                        field.key
                      ? //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                        formReady[field.key] ||
                        //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                        formReady[field.key.split('.').pop()!] ||
                        []
                      : [];
                      if (
                        !Array.isArray(fieldValues) ||
                        !Array.isArray(fieldOptions)
                      )
                        return [];
                      //@ts-ignore
                      let fieldValueIds = fieldValues.map(
                        //@ts-ignore
                        (item) => item.id
                      );
                      if (!fieldValueIds[0]) {
                        //@ts-ignore
                        fieldValueIds = fieldValues.map(
                          //@ts-ignore
                          (item) => item.value
                        );
                      }

                      return fieldOptions.filter((option) =>
                        fieldValueIds.includes(option.value)
                      );
                    })();

                    return (
                      <MultiSelect
                        key={`${field.key}-${fieldOptions.length}`}
                        options={fieldOptions}
                        className="basic-multi-select"
                        placeholder="Select "
                        defaultValues={
                          isFixedParent ? [parentData] : fieldDefaultValues
                        }
                        disabled={isFixedParent || field.disabled}
                        onChange={formField.onChange}
                      />
                    );
                  }, [
                    //@ts-ignore
                    multiSelectData[field.key],
                    formField.value,
                    formField.onChange,
                    field.key,
                    formReady,
                  ])}
                {field.type === 'multiselectstatic' &&
                  React.useMemo(() => {
                    //@ts-ignore
                    const fieldOptions = (() => {
                      // Get static options from field.values
                      if (
                        field.values &&
                        Array.isArray(field.values) &&
                        field.values.length > 0
                      ) {
                        return field.values.map((option:any) => ({
                          value: option.value || option.Value, // Handle both lowercase and uppercase
                          label: option.label || option.Label,
                        }));
                      }
                      return [];
                    })();

                    const fieldDefaultValues = (() => {
                      //@ts-ignore
                      const fieldValues =
                        //@ts-ignore
                        field.key
                      ? //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                        formReady[field.key] ||
                        //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                        formReady[field.key.split('.').pop()!] ||
                        []
                      : [];

                      if (
                        !Array.isArray(fieldValues) ||
                        !Array.isArray(fieldOptions)
                      ) {
                        return [];
                      }

                      //@ts-ignore
                      let fieldValueIds = fieldValues.map((item) => item.id);
                      if (!fieldValueIds[0]) {
                        //@ts-ignore
                        fieldValueIds = fieldValues.map((item) => item.value);
                      }

                      return fieldOptions.filter((option) =>
                        fieldValueIds.includes(option.value)
                      );
                    })();

                    return (
                      <MultiSelect
                        key={`${field.key}-${fieldOptions.length}`}
                        options={fieldOptions}
                        className="basic-multi-select"
                        placeholder="Select "
                        defaultValues={
                          isFixedParent ? [parentData] : fieldDefaultValues
                        }
                        disabled={isFixedParent || field.disabled}
                        onChange={formField.onChange}
                      />
                    );
                  }, [
                    //@ts-ignore
                    field.values, // Static options dependency
                    formField.value,
                    formField.onChange,
                    field.key,
                    formReady,
                  ])}
                {field.type === 'singleselect' && (
                  <Combobox
                    key={field.key}
                    options={
                      field.key
                        ? //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                          multiSelectData[field.key] ||
                          //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                          multiSelectData[field.key.split('.').pop()!] ||
                          []
                        : []
                    }
                    className="basic-single-select"
                    placeholder="Select "
                    disabled={isFixedParent || field.disabled}
                    defaultValue={
                      isFixedParent
                        ? parentData
                        : findMatchingOptionsForSingleSelect(
                            //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                            multiSelectData[field.key] || [],
                            formField.value || []
                          )
                    }
                    onChange={(selected) => {
                      formField.onChange(selected);
                    }}
                  />
                )}
                {field.type === 'filegallery' && (
                  // <div className="p-4" key={field.key}>
                  //   <FileUploader
                  //     multiple={true}
                  //     files={getFilesForKey(field.key)}
                  //     onFilesChange={(newFiles) => {
                  //       //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                  //       handleFileUpload(field.key, newFiles);
                  //     }}
                  //     buttonText="Upload Files"
                  //     id={`file-gallery-upload-${field.key}`}
                  //     accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.docx"
                  //     label={field.label || 'Upload Files'}
                  //   />
                  // </div>
                  <div className="p-4" key={field.key}>
                    <EnhancedFileUploader
                      multiple={true}
                      onFilesChange={(files) => {
                        // Your handleFileUpload function
                        //@ts-ignore
                        handleFileUpload(field.key, files);
                      }}
                      //@ts-ignore
                      value={getFilesForKey(field.key)}
                      buttonText="Select Files"
                      id={`file-gallery-upload-${field.key}`}
                    />
                  </div>
                )}
                {field.type === 'singleselectstatic' && (
                  <Combobox
                    key={field.key}
                    options={
                      field.key
                        ? //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                          singleSelectStaticOptions[field.key] ||
                          //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
                          singleSelectStaticOptions[
                            field.key.split('.').pop()!
                          ] ||
                          []
                        : []
                    }
                    className="basic-select"
                    disabled={isFixedParent || field.disabled}
                    defaultValue={formField.value}
                    onChange={(selected) => {
                      formField.onChange(selected);
                    }}
                    placeholder="Select an option..."
                  />
                )}
                {field.type === 'jsonArray' && (
                  <JsonFormField
                    field={formField}
                    label={field.label}
                    schema={field.schema}
                    required={field.required}
                    disabled={field.disabled}
                  />
                )}
                {field.type === 'file' && (
                  <EnhancedFileUploader
                    multiple={false}
                    onFilesChange={(file) => {
                      formField.onChange(file);
                    }}
                    value={formField.value}
                    buttonText="Select File"
                    id={`file-upload-${formField.name}`}
                  />
                )}
                {field.type === 'switch' && (
                  <Switch
                    id={field.key}
                    value={formField?.value || 'No'}
                    label=""
                    onChange={(value: any) => {
                      formField.onChange(value);
                    }}
                  />
                )}
                {field.type === 'number' && (
                  <Input
                    type="number"
                    {...formField}
                    className="border p-2 w-full bg-gray-200"
                    disabled={isFixedParent || field.disabled}
                    onChange={(e) => formField.onChange(Number(e.target.value))}
                  />
                )}
                {field.type === 'textarea' && (
                  <Textarea
                    {...formField}
                    className="border p-2 w-full"
                    disabled={isFixedParent || field.disabled}
                    onChange={(e) => formField.onChange(e.target.value)}
                  />
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const createNestedPath = (
    parentPath: string,
    childKey: string,
    index?: number
  ): string => {
    if (!parentPath) return childKey;
    if (typeof index === 'number') {
      return `${parentPath}[${index}].${childKey}`;
    }
    return `${parentPath}.${childKey}`;
  };

  // Recursive function to render nested fields
  const renderNestedField = (
    field: NestedFieldConfig,
    parentPath: string = '',
    level: number = 0,
    arrayIndex?: number
  ): any => {
    const currentPath =
      arrayIndex !== undefined
        ? createNestedPath(parentPath, field.key, arrayIndex)
        : createNestedPath(parentPath, field.key);

    // If this field has children, render as a nested container
    if (field.children && field.children.length > 0) {
      return renderNestedContainer(field, currentPath, level);
    }

    // Otherwise, render as a regular field using your existing renderFormField
    const adaptedField = {
      ...field,
      key: currentPath, // Use the nested path as the key
      parentPath,
      nestingLevel: level,
    };

    return (
      <div
        key={currentPath}
        className={`nested-field-wrapper level-${level}`}
        style={{ marginLeft: `${level * 16}px` }}
      >
        {renderFormField(adaptedField)}
      </div>
    );
  };

  // Function to render nested containers (objects or arrays)
  const renderNestedContainer = (
    field: NestedFieldConfig,
    currentPath: string,
    level: number
  ): any => {
    // Use the component-level state instead of local useState
    const arrayItems = getArrayItems(currentPath);

    if (field.containerType === 'array') {
      return (
        <div className="nested-array-container">
          <div className="flex items-center justify-between mb-4">
            <FormLabel>
              <BodyText variant="trimmed">{field.label}</BodyText>
              {field.required && (
                <span className="text-red-500 ml-1 text-xl font-bold">*</span>
              )}
            </FormLabel>
            <Button
              type="button"
              onClick={() => {
                const newIndex = Math.max(...arrayItems) + 1;
                updateArrayItems(currentPath, [...arrayItems, newIndex]);
              }}
            >
              {field.arrayConfig?.addButtonText || 'Add Item'}
            </Button>
          </div>

          <div className="space-y-4">
            {arrayItems.map((itemIndex, index) => (
              <div
                key={`${currentPath}-${itemIndex}`}
                className="relative border rounded-lg p-4"
                style={{ background: 'var(--surface-50)' }}
              >
                {arrayItems.length > 1 && (
                  <Button
                    type="button"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      const newItems = arrayItems.filter((_, i) => i !== index);
                      updateArrayItems(currentPath, newItems);
                    }}
                  >
                    {field.arrayConfig?.removeButtonText || 'Remove'}
                  </Button>
                )}

                <div className="space-y-4 pr-16">
                  {field.children?.map((childField) =>
                    renderNestedField(
                      childField,
                      currentPath,
                      level + 1,
                      itemIndex
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Object container
    return (
      <div className="nested-object-container">
        <FormLabel className="mb-4 block">
          <BodyText variant="trimmed">{field.label}</BodyText>
          {field.required && (
            <span className="text-red-500 ml-1 text-xl font-bold">*</span>
          )}
        </FormLabel>

        <div
          className="space-y-4 border rounded-lg p-4"
          style={{
            background: 'var(--surface-50)',
            borderLeft: `3px solid var(--primary)`,
            marginLeft: `${level * 8}px`,
          }}
        >
          {field.children?.map((childField) =>
            renderNestedField(childField, currentPath, level + 1)
          )}
        </div>
      </div>
    );
  };

  const organizeNestedFields = (formFields: NestedFieldConfig[]) => {
    const tabs = {};
    const ungroupedFields: NestedFieldConfig[] = [];

    const processField = (
      field: NestedFieldConfig,
      parentPath: string = ''
    ) => {
      // Process nested children first
      if (field.children) {
        field.children = field.children.map((child) => ({
          ...child,
          parentPath: createNestedPath(parentPath, field.key),
          nestingLevel: (field.nestingLevel || 0) + 1,
        }));
      }

      // Then organize by tabs/sections (your existing logic)
      if (field.tabId) {
        //@ts-ignore
        if (!tabs[field.tabId]) {
          //@ts-ignore
          tabs[field.tabId] = {
            id: field.tabId,
            name: field.tabName || `${field.tabId}`,
            sections: {},
            ungroupedFields: [],
          };
        }

        if (field.expandableSectionId) {
          //@ts-ignore
          if (!tabs[field.tabId].sections[field.expandableSectionId]) {
            //@ts-ignore
            tabs[field.tabId].sections[field.expandableSectionId] = {
              id: field.expandableSectionId,
              name:
                field.expandableSectionName || `${field.expandableSectionId}`,
              fields: [],
            };
          }
          //@ts-ignore
          tabs[field.tabId].sections[field.expandableSectionId].fields.push(
            field
          );
        } else {
          //@ts-ignore
          tabs[field.tabId].ungroupedFields.push(field);
        }
      } else if (field.expandableSectionId) {
        ungroupedFields.push(field);
      } else {
        ungroupedFields.push(field);
      }
    };

    formFields.forEach((field) => processField(field));
    return { tabs, ungroupedFields };
  };

  const renderEnhancedFormField = (field: NestedFieldConfig): any => {
    // If field has children, use nested rendering
    if (field.children && field.children.length > 0) {
      return renderNestedField(field);
    }

    // Otherwise, use your existing renderFormField function
    return renderFormField(field);
  };
  // Modified return statement with new hierarchy: tabs > sections > fields
  return (
    viewData && (
      <div
        className="flex flex-col w-full h-full min-h-screen "
        style={{ background: 'var(--background)' }}
      >
        <div
          className="w-full px-10 pt-8 pb-6"
          style={{
            background: 'var(--surface-100)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="w-full text-2xl py-[0.3125rem] font-bold text-foreground sticky top-0">
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
          </div>
        </div>

        <div className="flex-1 px-10 py-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 w-full pb-20"
            >
              {viewData &&
                (() => {
                  const { tabs, ungroupedFields } = organizeNestedFields(
                    viewData.displayModel.formFields
                  );

                  return (
                    <>
                      {/* Render ungrouped fields first (fields without tabs or sections) */}
                      {ungroupedFields.length > 0 && (
                        <div
                          className="space-y-6 p-6 rounded-lg border border-border"
                          style={{ background: 'var(--surface-100)' }}
                        >
                          <h3 className="text-lg font-semibold text-foreground">
                            General Information
                          </h3>
                          <div className="space-y-4">
                            {ungroupedFields.map((field) => {
                              // if (field.key === fixedParentKey) {
                              //   return null;
                              // }
                              return renderEnhancedFormField(field);
                            })}
                          </div>
                        </div>
                      )}

                      {/* Render tabs with sections and fields inside */}
                      {Object.keys(tabs).length > 0 && (
                        <CustomTabs
                          defaultValue={Object.keys(tabs)[0]}
                          className="w-full"
                        >
                          <CustomTabsList className="flex">
                            {Object.values(tabs).map((tab: any) => (
                              <CustomTabsTrigger key={tab.id} value={tab.id}>
                                {tab.name}
                              </CustomTabsTrigger>
                            ))}
                          </CustomTabsList>
                          {Object.values(tabs).map((tab: any) => (
                            <CustomTabsContent
                              key={tab.id}
                              value={tab.id}
                              className="space-y-6"
                            >
                              {/* Render ungrouped fields within this tab */}
                              {tab.ungroupedFields.length > 0 && (
                                <div
                                  className="space-y-6 p-6 rounded-lg border border-border"
                                  style={{ background: 'var(--surface-100)' }}
                                >
                                  <h4 className="text-lg font-medium text-foreground">
                                    Tab Fields
                                  </h4>
                                  <div className="space-y-4">
                                    {tab.ungroupedFields.map((field: any) =>
                                      renderEnhancedFormField(field)
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Render sections within this tab */}
                              {Object.keys(tab.sections).length > 0 && (
                                <CustomAccordion
                                  type="multiple"
                                  className="w-full"
                                >
                                  {Object.values(tab.sections).map(
                                    (section: any) => (
                                      <CustomAccordionItem
                                        key={section.id}
                                        value={section.id}
                                      >
                                        <CustomAccordionTrigger className="text-left">
                                          {section.name}
                                        </CustomAccordionTrigger>
                                        <CustomAccordionContent className="space-y-6">
                                          <div className="grid gap-6">
                                            {/* Render fields within this section */}
                                            {section.fields.map((field: any) =>
                                              renderEnhancedFormField(field)
                                            )}
                                          </div>
                                        </CustomAccordionContent>
                                      </CustomAccordionItem>
                                    )
                                  )}
                                </CustomAccordion>
                              )}
                            </CustomTabsContent>
                          ))}
                        </CustomTabs>
                      )}
                    </>
                  );
                })()}
              <div className="flex sticky bottom-0 w-full bg-background  justify-end pt-2 pb-2 border-t border-border">
                <Button
                  type="submit"
                  className="group relative px-6 py-2.5 rounded-md font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:scale-100 disabled:hover:shadow-none"
                  style={{
                    background:
                      putDetailsMutation.isPending ||
                      postDetailMutation.isPending ||
                      isSubmitting
                        ? 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
                        : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #2563eb) 100%)',
                    boxShadow:
                      '0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                  disabled={
                    putDetailsMutation.isPending ||
                    postDetailMutation.isPending ||
                    isSubmitting
                  }
                >
                  <div className="flex items-center justify-center space-x-2">
                    {putDetailsMutation.isPending ||
                    postDetailMutation.isPending ||
                    isSubmitting ? (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <HugeiconsIcon icon={SentIcon} size={`1rem`} />
                    )}
                    <span className="text-sm">
                      {putDetailsMutation.isPending ||
                      postDetailMutation.isPending ||
                      isSubmitting
                        ? 'Processing...'
                        : 'Submit Form'}
                    </span>
                  </div>

                  {/* Shimmer effect for loading state */}
                  {(putDetailsMutation.isPending ||
                    postDetailMutation.isPending ||
                    isSubmitting) && (
                    <div
                      className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                      style={{ animation: 'shimmer 2s infinite' }}
                    />
                  )}
                </Button>

                <style jsx>{`
                  @keyframes shimmer {
                    0% {
                      transform: translateX(-100%) skewX(-12deg);
                    }
                    100% {
                      transform: translateX(200%) skewX(-12deg);
                    }
                  }
                `}</style>
              </div>
            </form>
          </Form>
        </div>
      </div>
    )
  );
};
