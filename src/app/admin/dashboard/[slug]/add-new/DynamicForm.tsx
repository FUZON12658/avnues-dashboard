"use client";
import { crAxios } from "@/api";
import { uploadImageApi } from "@/api/uploadImage";
import CustomJodit from "@/components/common/CustomJodit";
import { BodyText } from "@/components/common/typography";
import { EnhancedFileUploader } from "@/components/filemanager/file-picker-modal";
import { Button } from "@/components/ui/button";
import {
  CustomAccordion,
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
  CustomTabs,
  CustomTabsContent,
  CustomTabsList,
  CustomTabsTrigger,
} from "@/components/ui/custom-tab";
import Combobox from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import JsonFormField from "@/components/ui/json-form-field";
import MultiSelect from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDeepCompareEffect } from "@/hooks/useDeepCompareEffect";
import { useDeepCompareMemo } from "@/hooks/useDeepCompareMemo";
import { useSyncProcessor } from "@/hooks/useSyncProcessor";
import { capitalizeFirstLetter, formatDateInNepaliTimezone } from "@/lib/utils";
import { NestedFieldConfig } from "@/types/NestedFieldConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Add01Icon,
  Edit02Icon,
  SentIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import { useParams, usePathname, useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DynamicFormProps } from "@/types/NestedFieldConfig";

function getValueByPath(obj: any, path: string) {
  return path
    .replace(/\[(\d+)]/g, ".$1") // convert [0] to .0
    .split(".")
    .reduce((acc, part) => acc?.[part], obj);
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
        case "text":
          if (allowAny) {
            fieldSchema = z.any();
            break;
          }
          fieldSchema = z.string();
          if (required)
            fieldSchema = fieldSchema.min(1, `${label} is required`);
          break;
        case "jsonArray":
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
        case "htmlfield":
          fieldSchema = z.string();
          if (required)
            fieldSchema = fieldSchema.min(1, `${label} is required`);
          break;
        case "file":
          fieldSchema = z.any(); // `File` instance validation may fail in some environments
          break;
        case "filegallery":
          fieldSchema = z.any(); // `File` instance validation may fail in some environments
          break;
        case "switch":
          fieldSchema = z.string().optional();
          break;
        case "number":
          if (allowAny) {
            fieldSchema = z.any();
            break;
          }
          fieldSchema = z.number();
          if (required)
            fieldSchema = fieldSchema.min(1, `${label} is required`);
          break;
        case "multiselect":
          fieldSchema = z.any();
          break;
        case "singleselectstatic":
          fieldSchema = z.any();
          break;
        case "singleselect":
          fieldSchema = z.any();
          break;
        case "time":
          fieldSchema = z.string();
          if (required)
            fieldSchema = fieldSchema.min(1, `${label} is required`);
          break;
        case "date":
          fieldSchema = z.string();
          if (allowAny) {
            fieldSchema = z.any();
            break;
          }
          if (required)
            fieldSchema = fieldSchema.min(1, `${label} is required`);
          break;
        case "hidden":
          fieldSchema = z.any();
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

// Helper function to check if field is a fixed parent
const isFixedParentField = (fieldKey: any, fixedParents: any[]) => {
  return fixedParents?.some((parent) => parent.key === fieldKey) || false;
};

// Helper function to get fixed parent data for a field
const getFixedParentData = (fieldKey: string, fixedParents: any[]) => {
  return fixedParents?.find((parent) => parent.key === fieldKey)?.details;
};

const getDataFromRoute = async (route: string) => {
  const response = await crAxios.get(route);
  return response.data;
};

export const DynamicForm: React.FC<DynamicFormProps> = ({
  suppliedId,
  fixedParents,
  fetchLink,
  formDataSupplied,
}) => {
  const router = useRouter();
  const { slug } = useParams();
  const pathname = usePathname();
  const queryClient = new QueryClient();

  const dataFilledRef = React.useRef(false);
  const editor = React.useRef<any>(null);

  const [multiSelectData, setMultiSelectData] = React.useState({});
  const [submitFormState, setSubmitFormState] = React.useState("submit");
  const [showPassword, setShowPassword] = React.useState(false);
  const [files, setFiles] = React.useState<Record<string, File[]>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formReady, setFormReady] = React.useState({});
  const [stableDynamicFields, setStableDynamicFields] = React.useState<
    Map<string, any>
  >(new Map());
  const [singleSelectStaticOptions, setSingleSelectStaticOptions] =
    React.useState({});
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
      processedLink = processedLink.replace("{id}", item.id.toString());
    } else if (suppliedId !== null && suppliedId !== undefined) {
      processedLink = processedLink.replace("{id}", suppliedId.toString());
    }

    if (slug !== undefined) {
      processedLink = processedLink.replace("{slug}", slug.toString());
    }

    return processedLink;
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
    sortOrder: "ASC" | "DESC" = "DESC",
    fetchLink?: any
  ) => {
    const response = await crAxios.get(
      fetchLink ? fetchLink : `/api/v1/${slug}`,
      {
        params: { limit, offset, sort: sortOrder },
      }
    );
    return response.data;
  };

  const putDetailsMutation = useMutation({
    mutationFn: putDetailsApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [`${slug}-${suppliedId}-view`],
      });
      queryClient.invalidateQueries({
        queryKey: [`${slug}-view`],
      });
      setIsSubmitting(false);
      if (!pathname.includes("edit") && submitFormState === "saveAndContinue") {
        router.push(`/admin/dashboard/${slug}/edit/${data.mainData.id}`);
      }
      if (pathname.includes("edit") && submitFormState === "saveAndAddNew") {
        router.push(`/admin/dashboard/${slug}/add-new`);
      }
      if (
        pathname.includes("/add-new") &&
        submitFormState === "saveAndAddNew"
      ) {
        window.location.reload();
      }
      if (
        pathname.includes("/add-new") &&
        submitFormState === "saveAndContinue"
      ) {
        router.push(`/admin/dashboard/${slug}/edit/${data.mainData.id}`);
      }
      if (submitFormState === "submit") {
        router.push(`/admin/dashboard/${slug}`);
      }
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      const message =
        typeof error?.response?.data?.error === "string"
          ? error.response.data.error
          : "Something went wrong!";
      toast.error(message);
    },
  });

  const postDetailMutation = useMutation({
    mutationFn: postDetailsApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [`${slug}-view`],
      });
      setIsSubmitting(false);
      if (!pathname.includes("edit") && submitFormState === "saveAndContinue") {
        router.push(`/admin/dashboard/${slug}/edit/${data.mainData.id}`);
      }
      if (pathname.includes("edit") && submitFormState === "saveAndAddNew") {
        router.push(`/admin/dashboard/${slug}/add-new`);
      }
      if (pathname.includes("add-new") && submitFormState === "saveAndAddNew") {
        window.location.reload();
      }
      if (
        pathname.includes("add-new") &&
        submitFormState === "saveAndContinue"
      ) {
        router.push(`/admin/dashboard/${slug}/edit/${data.mainData.id}`);
      }
      if (submitFormState === "submit") {
        router.push(`/admin/dashboard/${slug}`);
      }
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      const message =
        typeof error?.response?.data?.error === "string"
          ? error.response.data.error
          : "Something went wrong!";
      toast.error(message);
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: uploadImageApi,
    onError: () => {
      setIsSubmitting(false);
      toast.error("Unable to uplaod images!");
    },
  });

  const {
    data: viewData,
    isLoading,
    error,
    refetch: viewDataRefetch,
  } = useQuery({
    queryKey: [`${slug}-view`],
    queryFn: () => getDetailsApi(1, 0, "DESC", fetchLink),
    gcTime: 0,
  });

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
  const formValues = form.watch();

  const syncProcessor = useSyncProcessor(
    viewData?.displayModel?.formFields || [],
    formValues
  );
  const { visibleFields, dynamicFields } = useSyncProcessor(
    viewData?.displayModel?.formFields || [], // The form field configuration
    formValues // Current form values
  );

  React.useEffect(() => {
    setStableDynamicFields(new Map(dynamicFields));
  }, [dynamicFields]);

  React.useEffect(() => {
    if (viewData && !dataFilledRef.current && formDataSupplied) {
      const newDefaultValues = viewData.displayModel.formFields.reduce(
        //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
        (acc, { key, type, populatedKey, defaultValue }) => {
          if (type === "switch") {
            acc[key] = formDataSupplied?.[key] ? "Yes" : "No";
          } else if (type === "number") {
            acc[key] = formDataSupplied?.[key] ?? 0;
          } else if (type === "multiselect") {
            const value = formDataSupplied?.[key]
              ? formDataSupplied?.[populatedKey]
                ? formDataSupplied?.[populatedKey]
                : formDataSupplied?.[key]
              : null;

            // Simply assign the raw value without formatting
            acc[key] = value;
          } else if (type === "singleselect") {
            acc[key] = formDataSupplied?.[key]
              ? formDataSupplied?.[populatedKey]
                ? formDataSupplied?.[populatedKey]
                : formDataSupplied?.[key]
              : null;
          } else if (type === "file") {
            // For file fields, use populatedKey if available, otherwise fall back to key
            const dataKey = populatedKey || key;
            acc[key] = formDataSupplied?.[dataKey] || null;
          } else if (type === "filegallery") {
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
          } else if (type === "singleselectstatic") {
            const value = formDataSupplied?.[key];
            acc[key] = value;
          } else if (type === "multiselectstatic") {
            const value = formDataSupplied?.[key];
            acc[key] = value;
          } else if (type === "time") {
            acc[key] = formDataSupplied?.[key] ?? "";
          } else if (type === "date") {
            const dateValue = formDataSupplied?.[key];
            acc[key] = dateValue
              ? new Date(dateValue).toISOString().split("T")[0]
              : "";
          } else if (type === "hidden") {
            acc[key] = formDataSupplied?.[key] ?? defaultValue;
          } else {
            acc[key] = formDataSupplied?.[key] ?? "";
          }
          return acc;
        },
        {}
      );
      form.reset(newDefaultValues); // ✅ Dynamically update form values
      if (newDefaultValues) {
        setFormReady(newDefaultValues);
      }
    }
    if (viewData && !formDataSupplied) {
      const hiddenDefaults = viewData.displayModel.formFields.reduce(
        //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
        (acc, { key, type, defaultValue }) => {
          if (type === "hidden" && defaultValue) {
            acc[key] = defaultValue;
          }
          return acc;
        },
        {}
      );

      if (Object.keys(hiddenDefaults).length > 0) {
        form.reset(hiddenDefaults);
      }
    }
  }, [viewData, form, formDataSupplied]);

  const multiSelectFields = React.useMemo(() => {
    const collectMultiSelectFields = (fields: any) => {
      const result: any = [];
      if (!fields || !Array.isArray(fields)) return result;

      fields.forEach((field) => {
        // Check current field
        if (
          (field.type === "multiselect" || field.type === "singleselect") &&
          (field.dataRoute ||
            (field.sync && field.sync.dynamicAPI) ||
            syncProcessor.getFieldApiConfig(field.key)) && // Add API config check
          field.dataToShow
        ) {
          result.push(field);
        }

        // Recursively check children
        if (field.children && Array.isArray(field.children)) {
          result.push(...collectMultiSelectFields(field.children));
        }
      });
      return result;
    };

    // Collect static fields
    const staticFields = collectMultiSelectFields(
      viewData?.displayModel?.formFields || []
    );

    // Collect dynamic fields that are multiselect/singleselect using stable state
    const dynamicMultiSelectFields: any[] = [];
    stableDynamicFields.forEach((field, key) => {
      const apiConfig = syncProcessor.getFieldApiConfig(key);
      if (
        (field.type === "multiselect" || field.type === "singleselect") &&
        (field.dataRoute ||
          (field.sync && field.sync.dynamicAPI) ||
          apiConfig) && // Include fields with API config
        (field.dataToShow || apiConfig?.dataToShow) &&
        visibleFields.has(key)
      ) {
        dynamicMultiSelectFields.push({
          ...field,
          key: key,
          // Override with API config if available
          ...(apiConfig && {
            dataRoute: apiConfig.dataRoute,
            dataToShow: apiConfig.dataToShow,
            populatedKey: apiConfig.populatedKey,
          }),
        });
      }
    });
    return [...staticFields, ...dynamicMultiSelectFields];
  }, [viewData, stableDynamicFields, visibleFields, syncProcessor]);

  React.useEffect(() => {
    if (viewData) {
      const staticOptions = {};

      const processFields = (fields: any) => {
        if (!fields || !Array.isArray(fields)) return;

        fields.forEach((field) => {
          // Handle singleselectstatic fields
          if (
            field.type === "singleselectstatic" &&
            Array.isArray(field.values)
          ) {
            //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
            staticOptions[field.key] = field.values
              .filter(
                (value: any) =>
                  !(value.editModeParam && !pathname.includes("edit"))
              )
              .map((value: any) =>
                value.value
                  ? { value: value.value, label: value.label }
                  : { value, label: value }
              );
          }

          // Handle static multiselect options provided directly in formFields
          if (field.type === "multiselect" && Array.isArray(field.options)) {
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

  //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
  const transformQueryData = React.useCallback((data, restrictedData, dataToShow) => {
    if (!data || data.length <= 0 || !dataToShow) return [{}];
     const restrictedIds = new Set(restrictedData?.map((item:any) => item.id) || []);
    //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
    return data.map((item) => {
      // Get label by joining the specified fields
      //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
      const labelParts = dataToShow.map((field) => {
        // Check if the field is nested
        if (field.includes(".")) {
          return renderNestedValue(item, field);
        }
        if (field === "date") {
          return formatDateInNepaliTimezone(item[field], false);
        }
        // Otherwise, access it directly
        return item[field] ?? "—";
      });

      const label = labelParts.join(" : ");

      return {
        value: item.id,
        label: label || "Untitled", // Fallback if no fields are available
        isRestricted: restrictedIds.has(item.id)
      };
    });
  }, []);

  // Helper function to handle nested paths
  //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
  const renderNestedValue = (obj, key) => {
    if (!obj) return "—";

    // Handle nested paths like 'user.fullName' or 'group.groupName'
    const parts = key.split(".");
    let value = obj;

    for (const part of parts) {
      value = value[part];
      if (value === undefined || value === null) return "—";
    }

    return value;
  };

  const findMatchingOptionsForSingleSelect = React.useCallback(
    //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
    (options, fieldValues) => {
      if (!Array.isArray(options)) return [];
      let fieldValueIds = fieldValues.id;
      if (!fieldValueIds) {
        fieldValueIds = fieldValues.value;
      }
      // Find matching options based on the IDs
      const matchingValues = options.filter(
        (option) => fieldValueIds === option.value
      );
      return matchingValues[0];
    },
    [slug]
  );
  // Check if all fields have data

  const processLinkInsideQueriesConfig = (
    dataRoute: string,
    filterParams: any
  ) => {
    if (!filterParams) return dataRoute;

    const url = new URL(dataRoute, window.location.origin);
    Object.entries(filterParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, String(value));
      }
    });

    return url.pathname + url.search;
  };

  const handleDataUpdateWithValidation = React.useCallback(
    (key: string, transformedData: any[], originalFieldKey: string) => {
      // Validate the transformed data
      if (!Array.isArray(transformedData) || transformedData.length === 0) {
        console.warn(
          `⚠️ Empty or invalid data for field ${key}:`,
          transformedData
        );
      }

      setMultiSelectData((prev) => {
        const newData = {
          ...prev,
          [key]: transformedData,
        };

        // FIX: Also store data under the original field key if different
        if (originalFieldKey !== key) {
          //@ts-ignore
          newData[originalFieldKey] = transformedData;
        }

        // Clean up data for fields that are no longer visible
        const currentFieldKeys = multiSelectFields.map((f) => f.key);
        const currentPopulatedKeys = multiSelectFields.map((f) => {
          const apiConfig = syncProcessor.getFieldApiConfig(f.key);
          return apiConfig?.populatedKey || f.populatedKey || f.key;
        });

        const allValidKeys = [...currentFieldKeys, ...currentPopulatedKeys];

        Object.keys(newData).forEach((dataKey) => {
          if (!allValidKeys.includes(dataKey)) {
            //@ts-ignore
            delete newData[dataKey];
          }
        });

        return newData;
      });
    },
    [multiSelectFields, syncProcessor]
  );

  const queriesConfig = useDeepCompareMemo(() => {
    if (!viewData || !multiSelectFields.length) return [];

    return multiSelectFields.map(
      ({ key, dataRoute, dataToShow, sync, populatedKey }) => {
        // Check for API config from sync processor
        const apiConfig = syncProcessor.getFieldApiConfig(key);

        // Use API config if available, otherwise fall back to field properties
        const finalDataRoute = apiConfig?.dataRoute || dataRoute;
        const finalDataToShow = apiConfig?.dataToShow || dataToShow;
        const finalPopulatedKey =
          apiConfig?.populatedKey || populatedKey || key;

        // Handle dynamic API configuration
        if (sync && sync.dynamicAPI && sync.dependentOn) {
          //@ts-ignore
          const dependentFieldValue = formValues[sync.dependentOn];

          if (!dependentFieldValue) {
            return {
              queryKey: [`${slug}-${key}-data-disabled`],
              queryFn: () => Promise.resolve({ mainData: [] }),
              enabled: false,
            };
          }

          const dependentValue =
            typeof dependentFieldValue === "object" &&
            dependentFieldValue?.value
              ? dependentFieldValue.value
              : dependentFieldValue;

          const dynamicConfig = sync.dynamicAPI[dependentValue];

          if (!dynamicConfig) {
            return {
              queryKey: [`${slug}-${key}-data-no-config`],
              queryFn: () => Promise.resolve({ mainData: [] }),
              enabled: false,
            };
          }

          // FIX: More stable query key that includes all relevant dependencies
          const stableQueryKey = [
            `${slug}-${key}-data`,
            dependentValue,
            JSON.stringify(dynamicConfig.filterParams || {}),
            "dynamic-field",
            // Add API config to query key to invalidate when it changes
            apiConfig ? JSON.stringify(apiConfig) : "no-api-config",
          ];

          return {
            queryKey: stableQueryKey,
            queryFn: async () => {
              const url = processLinkInsideQueriesConfig(
                dynamicConfig.dataRoute,
                dynamicConfig.filterParams
              );
              return getDataFromRoute(url);
            },
            enabled: !!(
              viewData &&
              dynamicConfig.dataRoute &&
              dependentFieldValue &&
              visibleFields.has(key)
            ),
            staleTime: 5 * 60 * 1000,
            // FIX: Add retry logic and better error handling
            retry: 3,
            retryDelay: (attemptIndex: any) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            onSuccess: (data: any) => {
              if (!data) return;
              const transformedData = transformQueryData(
                data.mainData||[],
                data.restrictedData||[],
                dynamicConfig.dataToShow || finalDataToShow
              );
              // FIX: Use a more robust data update mechanism
              handleDataUpdateWithValidation(
                finalPopulatedKey,
                transformedData,
                key
              );
            },
            onError: (error: any) => {
              console.error(
                `❌ Failed to fetch dynamic data for ${key}:`,
                error
              );
            },
          };
        }

        // Handle API config fields (from sync processor)
        if (apiConfig && finalDataRoute) {
          // FIX: More stable query key for API config fields
          const apiConfigQueryKey = [
            `${slug}-${key}-data-api-config`,
            JSON.stringify(apiConfig), // Include full API config in key
            visibleFields.has(key) ? "visible" : "hidden",
          ];

          return {
            queryKey: apiConfigQueryKey,
            queryFn: async () => {
              return getDataFromRoute(processLink(finalDataRoute, null));
            },
            enabled: !!(viewData && finalDataRoute && visibleFields.has(key)),
            staleTime: 5 * 60 * 1000,
            retry: 3,
            retryDelay: (attemptIndex: any) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            onSuccess: (data: any) => {
              if (!data) return;
              const transformedData = transformQueryData(
                data.mainData||[],
                data.restrictedData||[],
                finalDataToShow
              );
              handleDataUpdateWithValidation(
                finalPopulatedKey,
                transformedData,
                key
              );
            },
            onError: (error: any) => {
              console.error(
                `❌ Failed to fetch API config data for ${key}:`,
                error
              );
            },
          };
        }

        // Fallback to static dataRoute (existing logic)
        return {
          queryKey: [`${slug}-${key}-data`],
          queryFn: async () => {
            return getDataFromRoute(processLink(finalDataRoute, null));
          },
          enabled: !!(viewData && finalDataRoute && visibleFields.has(key)),
          staleTime: Infinity,
          onSuccess: (data: any) => {
            if (!data) return;
            const transformedData = transformQueryData(
              data.mainData||[],
              data.restrictedData||[],
              finalDataToShow
            );
            handleDataUpdateWithValidation(
              finalPopulatedKey,
              transformedData,
              key
            );
          },
          onError: (error: any) => {
            console.error(`❌ Failed to fetch static data for ${key}:`, error);
          },
        };
      }
    );
  }, [
    multiSelectFields,
    slug,
    viewData,
    formValues,
    transformQueryData,
    visibleFields,
    stableDynamicFields,
    syncProcessor,
    // FIX: Add fieldApiConfig as dependency to ensure queries update when API config changes
    JSON.stringify(Array.from(syncProcessor.fieldApiConfig.entries())),
  ]);

  const multiSelectQueries = useQueries({ queries: queriesConfig });
  // Only update when not already filled
  useDeepCompareEffect(() => {
    // FIX: Process query results even if dataFilledRef is true, to handle dynamic updates
    const allQueriesWithData = multiSelectQueries.filter(
      (query) => query.isSuccess && query.data && query.data.mainData
    );

    if (allQueriesWithData.length > 0 && viewData) {
      allQueriesWithData.forEach((query, index) => {
        const field = multiSelectFields.find((f, i) => {
          // Find the corresponding field for this query
          const queryIndex = multiSelectQueries.indexOf(query);
          return i === queryIndex;
        });

        if (field && query.data.mainData) {
          const apiConfig = syncProcessor.getFieldApiConfig(field.key);
          const finalPopulatedKey =
            apiConfig?.populatedKey || field.populatedKey || field.key;
          const finalDataToShow = apiConfig?.dataToShow || field.dataToShow;

          const transformedData = transformQueryData(
            query.data.mainData,
            query.data.restrictedData,
            finalDataToShow
          );

          // FIX: Always update data, don't skip based on dataFilledRef
          handleDataUpdateWithValidation(
            finalPopulatedKey,
            transformedData,
            field.key
          );
        }
      });
    }

    // FIX: Handle query errors
    const failedQueries = multiSelectQueries.filter((query) => query.isError);
    if (failedQueries.length > 0) {
      console.error(
        "❌ Failed queries:",
        failedQueries.map((q) => q.error)
      );
    }
  }, [
    multiSelectQueries,
    multiSelectFields,
    viewData,
    transformQueryData,
    syncProcessor,
    handleDataUpdateWithValidation,
  ]);

  React.useEffect(() => {
    // Invalidate queries when field API config changes
    const apiConfigKeys = Array.from(syncProcessor.fieldApiConfig.keys());

    if (apiConfigKeys.length > 0) {
      apiConfigKeys.forEach((fieldKey) => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey.some(
              (key) => typeof key === "string" && key.includes(fieldKey)
            );
          },
        });
      });
    }
  }, [
    JSON.stringify(Array.from(syncProcessor.fieldApiConfig.entries())),
    queryClient,
  ]);

  //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
  const onSubmit = async (data, action) => {
    try {
      setIsSubmitting(true);
      setSubmitFormState(action);
      let processedData = { ...data };
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
          fieldType === "file" &&
          typeof value === "object" &&
          value !== null
        ) {
          //@ts-ignore
          processedData[key] = value.id;
        }

        if (fieldType === "scorecard") {
          //@ts-ignore
          delete processedData[key];
        }

        if (fieldType === "jsonArray" && Array.isArray(value)) {
          //@ts-ignore
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
        if (fieldType === "filegallery") {
          const currentFiles = files[key]; // Get files for this specific key
          if (!currentFiles || currentFiles.length === 0) return;

          let valuesArray: (File | string)[];
          if (Array.isArray(currentFiles)) {
            valuesArray = currentFiles;
          } else {
            throw new Error("Invalid value type for filegallery");
          }

          const uploadedUrls = await Promise.all(
            valuesArray.map(async (item:any) => {
              if (item instanceof File) {
                const uploadResponse = await uploadImageMutation.mutateAsync(
                  item
                );
                return uploadResponse.url;
              }
              return item.id; // It's already a URL string
            })
          );
          //@ts-ignore
          processedData[key] = uploadedUrls;
        }
        // Handle multiselect fields
        if (
          fieldType === "multiselect" &&
          Array.isArray(value) &&
          value.length > 0 &&
          (value[0]?.value || value[0]?.id)
        ) {
          //@ts-ignore
          if (processedData[key] && processedData[key].length > 0) {
            //@ts-ignore
            processedData[key] = value.map((item) => item.value || item.id);
          } else {
            //@ts-ignore
            processedData[key] = null;
          }
          // Extract just the value from each selected option
        }

        if (fieldType === "singleselect") {
          if (value && typeof value === "object" && "value" in value) {
            //@ts-ignore
            processedData[key] = value.value;
          } else if (
            fieldType === "singleselect" &&
            value &&
            typeof value === "object" &&
            "id" in value
          ) {
            //@ts-ignore
            processedData[key] = value.id;
          } else if (value) {
            //@ts-ignore
            processedData[key] = value;
          } else {
            //@ts-ignore
            processedData[key] = null;
          }
        }

        if (fieldType === "switch") {
          //@ts-ignore
          processedData[key] = value === "Yes";
        }

        if (fieldType === "date" && typeof value === "string") {
          //@ts-ignore
          processedData[key] = value ? new Date(value).toISOString() : null; // This gives you the UTC date in ISO 8601 format
        }
        if (
          fieldType === "singleselectstatic" &&
          value &&
          typeof value === "object" &&
          "value" in value
        ) {
          //@ts-ignore
          processedData[key] = value.value;
        }
      }
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
      console.error("Form submission error:", error);
    }
  };

  const renderFormField = React.useCallback(
    (field: any) => {
      // Check visibility
      if (
        field.sync &&
        !syncProcessor.isFieldVisible(field.key) &&
        !syncProcessor.isFieldVisible(field.key.split(".").pop()!)
      ) {
        return null;
      }

      // Get dynamic options
      const syncOptions =
        syncProcessor.getFieldOptions(field.key) ||
        syncProcessor.getFieldOptions(field.key.split(".").pop()!);

      // Get API config
      const apiConfig =
        syncProcessor.getFieldApiConfig(field.key) ||
        syncProcessor.getFieldApiConfig(field.key.split(".").pop()!);

      // FIX: Improved API data options retrieval with multiple fallbacks
      const getApiDataOptions = () => {
        if (!apiConfig) return [];

        const keys = [
          apiConfig.populatedKey,
          apiConfig.populatedKey?.split(".").pop(),
          field.key,
          field.key.split(".").pop(),
        ].filter(Boolean);

        for (const key of keys) {
          //@ts-ignore
          const data = multiSelectData[key];
          if (data && Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
        return [];
      };

      const apiDataOptions = getApiDataOptions();

      // FIX: Better option priority with validation
      const dynamicOptions = (() => {
        if (
          syncOptions &&
          Array.isArray(syncOptions) &&
          syncOptions.length > 0
        ) {
          return syncOptions;
        }

        if (apiConfig && apiDataOptions.length > 0) {
          return apiDataOptions;
        }
        return null;
      })();

      // Log the final options being used
      if (dynamicOptions && dynamicOptions.length > 0) {
        dynamicOptions.filter((option: any) => {
          return option.value !== suppliedId;
        });
      }

      // Get dynamic field configuration
      let actualField =
        syncProcessor.getDynamicField(field.key) ||
        syncProcessor.getDynamicField(field.key.split(".").pop()!) ||
        field;

      const isFixedParent = isFixedParentField(actualField.key, fixedParents);
      const parentData = getFixedParentData(actualField.key, fixedParents);

      // Helper function for multiselect data (no useMemo)
      const getMultiselectData = () => {
        if (actualField.type !== "multiselect") return null;

        const fieldOptions =
          dynamicOptions ||
          (() => {
            return actualField.key
              ? //@ts-ignore
                multiSelectData[actualField.key] ||
                  //@ts-ignore
                  multiSelectData[actualField.key.split(".").pop()!] ||
                  []
              : [];
          })();

        const fieldDefaultValues = (() => {
          //@ts-ignore
          const fieldValues = actualField.key
            ? //@ts-expect-error
              formReady[actualField.key] ??
              getValueByPath(formReady, actualField.key)
            : [];

          const formatValue = (value: any) => {
            if (Array.isArray(value)) {
              return value.map((item) =>
                typeof item === "object" && item !== null
                  ? item
                  : { label: item, value: item }
              );
            } else if (value !== null && value !== undefined) {
              return typeof value === "object" && value !== null
                ? [value]
                : [{ label: value, value: value }];
            }
            return [];
          };
          const formattedFieldValues = formatValue(fieldValues);
          if (
            !Array.isArray(formattedFieldValues) ||
            !Array.isArray(fieldOptions)
          )
            return [];

          //@ts-ignore
          let fieldValueIds = formattedFieldValues.map((item) => item.id);
          if (!fieldValueIds[0]) {
            //@ts-ignore
            fieldValueIds = formattedFieldValues.map((item) => item.value);
          }

          return fieldOptions.filter((option) =>
            fieldValueIds.includes(option.value)
          );
        })();

        return { fieldOptions, fieldDefaultValues };
      };

      // Helper function for multiselect static data (no useMemo)
      const getMultiselectStaticData = () => {
        if (actualField.type !== "multiselectstatic") return null;

        const fieldOptions =
          dynamicOptions ||
          (() => {
            if (
              actualField.values &&
              Array.isArray(actualField.values) &&
              actualField.values.length > 0
            ) {
              return actualField.values.map((option: any) => ({
                value: option.value || option.Value,
                label: option.label || option.Label,
              }));
            }
            return [];
          })();

        const fieldDefaultValues = (() => {
          //@ts-ignore
          const fieldValues = (() => {
            if (!actualField.key) return [];

            const getNestedValue = (obj: any, path: string) => {
              return path.split(".").reduce((current, key) => {
                return current && current[key] !== undefined
                  ? current[key]
                  : undefined;
              }, obj);
            };

            const nestedValue = getNestedValue(formReady, actualField.key);
            if (nestedValue !== undefined) return nestedValue;

            //@ts-ignore
            const directValue = formReady[actualField.key];
            if (directValue !== undefined) return directValue;

            const lastKey = actualField.key.split(".").pop();
            //@ts-ignore
            return formReady[lastKey!] || [];
          })();
          const formatValue = (value: any) => {
            if (Array.isArray(value)) {
              return value.map((item) =>
                typeof item === "object" && item !== null
                  ? item
                  : { label: item, value: item }
              );
            } else if (value !== null && value !== undefined) {
              return typeof value === "object" && value !== null
                ? [value]
                : [{ label: value, value: value }];
            }
            return [];
          };

          const formattedFieldValues = formatValue(fieldValues);
          if (
            !Array.isArray(formattedFieldValues) ||
            !Array.isArray(fieldOptions)
          ) {
            return [];
          }

          //@ts-ignore
          let fieldValueIds = formattedFieldValues.map((item) => item.id);
          if (!fieldValueIds[0]) {
            //@ts-ignore
            fieldValueIds = formattedFieldValues.map((item) => item.value);
          }

          return fieldOptions.filter((option) =>
            fieldValueIds.includes(option.value)
          );
        })();

        return { fieldOptions, fieldDefaultValues };
      };

      const multiselectData = getMultiselectData();
      const multiselectStaticData = getMultiselectStaticData();

      return (
        <FormField
          control={form.control}
          key={actualField.key}
          //@ts-ignore
          name={actualField.key}
          render={({ field: formField }) => (
            <FormItem>
              {actualField.type !== "hidden" && (
                <FormLabel>
                  <BodyText variant="trimmed"> {actualField.label}</BodyText>
                  {actualField.required && (
                    <span className="text-red-500 ml-1 text-xl font-bold">
                      *
                    </span>
                  )}
                </FormLabel>
              )}
              <FormControl className="">
                <div className="min-w-full">
                  {actualField.type === "text" && (
                    <Input
                      className="border p-2 w-full"
                      placeholder={actualField.placeholder || "Input"}
                      disabled={isFixedParent || actualField.disabled}
                      {...formField}
                    />
                  )}
                  {actualField.type === "hidden" && (
                    <Input
                      className="hidden"
                      placeholder={actualField.placeholder || "Input"}
                      disabled={isFixedParent || actualField.disabled}
                      {...formField}
                      value={actualField.defaultValue || ""}
                      onChange={() => {}} // Dummy onChange since it's hidden
                    />
                  )}
                  {actualField.type === "time" && (
                    <Input
                      type="time"
                      className="border p-2 w-full"
                      disabled={isFixedParent || actualField.disabled}
                      {...formField}
                    />
                  )}
                  {actualField.type === "password" && (
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="border p-2 w-full pr-10"
                        placeholder={actualField.placeholder}
                        disabled={isFixedParent || actualField.disabled}
                        {...formField}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isFixedParent || actualField.disabled}
                      >
                        <HugeiconsIcon
                          icon={showPassword ? ViewIcon : ViewOffIcon}
                          className="h-5 w-5 text-white cursor-pointer hover:text-white/75"
                        />
                      </button>
                    </div>
                  )}
                  {actualField.type === "date" && (
                    <Input
                      type="date"
                      className="border p-2 w-full"
                      disabled={isFixedParent || actualField.disabled}
                      {...formField}
                    />
                  )}
                  {actualField.type === "htmlfield" && (
                    <div className="w-full -ml-2 mr-auto">
                      <CustomJodit
                        ref={editor}
                        onChange={formField.onChange}
                        value={formField.value}
                        variable="blogPreview"
                        editorStyles="min-width:100% !important; min-height:400px !important;"
                      />
                    </div>
                  )}
                  {actualField.type === "multiselect" && multiselectData && (
                    <MultiSelect
                      key={`${actualField.key}-${
                        multiselectData.fieldOptions?.length || 0
                      }`}
                      options={
                        multiselectData.fieldOptions.filter(
                          (option: any) => option.value !== suppliedId
                        ) || []
                      }
                      className="basic-multi-select"
                      placeholder={
                        actualField.placeholder || "Select an option..."
                      }
                      defaultValues={
                        isFixedParent
                          ? [parentData]
                          : multiselectData.fieldDefaultValues || []
                      }
                      disabled={isFixedParent || actualField.disabled}
                      onChange={formField.onChange}
                    />
                  )}
                  {actualField.type === "multiselectstatic" &&
                    multiselectStaticData && (
                      <MultiSelect
                        key={`${actualField.key}-${
                          multiselectStaticData.fieldOptions?.length || 0
                        }`}
                        options={multiselectStaticData.fieldOptions || []}
                        className="basic-multi-select"
                        placeholder={
                          actualField.placeholder || "Select an option..."
                        }
                        defaultValues={
                          isFixedParent
                            ? [parentData]
                            : multiselectStaticData.fieldDefaultValues || []
                        }
                        disabled={isFixedParent || actualField.disabled}
                        onChange={formField.onChange}
                      />
                    )}
                  {actualField.type === "singleselect" && (
                    <Combobox
                      key={actualField.key}
                      options={
                        dynamicOptions ||
                        (actualField.key
                          ? //@ts-expect-error
                            multiSelectData[actualField.key] ||
                            //@ts-expect-error
                            multiSelectData[
                              actualField.key.split(".").pop()!
                            ] ||
                            []
                          : []
                        ).filter((option: any) => option.value !== suppliedId)
                      }
                      className="basic-single-select"
                      placeholder={
                        actualField.placeholder || "Select an option..."
                      }
                      disabled={isFixedParent || actualField.disabled}
                      defaultValue={
                        isFixedParent
                          ? parentData
                          : findMatchingOptionsForSingleSelect(
                              dynamicOptions ||
                                //@ts-ignore
                                multiSelectData[actualField.key] ||
                                [],
                              formField.value || []
                            )
                      }
                      onChange={(selected) => {
                        formField.onChange(selected);
                      }}
                    />
                  )}
                  {actualField.type === "singleselectstatic" && (
                    <Combobox
                      key={actualField.key}
                      id={suppliedId}
                      options={
                        dynamicOptions ||
                        (actualField.key
                          ? //@ts-expect-error
                            singleSelectStaticOptions[actualField.key] ||
                            //@ts-expect-error
                            singleSelectStaticOptions[
                              actualField.key.split(".").pop()!
                            ] ||
                            []
                          : [])
                      }
                      className="basic-select"
                      disabled={isFixedParent || actualField.disabled}
                      placeholder={
                        actualField.placeholder || "Select an option..."
                      }
                      defaultValue={
                        isFixedParent
                          ? parentData
                          : formField.value
                          ? { value: formField.value, label: formField.value }
                          : null
                      }
                      onChange={(selected) => {
                        formField.onChange(selected);
                      }}
                    />
                  )}
                  {actualField.type === "filegallery" && (
                    <div className="p-4" key={actualField.key}>
                      <EnhancedFileUploader
                        multiple={true}
                        onFilesChange={(files) => {
                          //@ts-ignore
                          handleFileUpload(actualField.key, files);
                        }}
                        //@ts-ignore
                        value={getFilesForKey(actualField.key)}
                        buttonText="Select Files"
                        id={`file-gallery-upload-${actualField.key}`}
                      />
                    </div>
                  )}
                  {actualField.type === "jsonArray" && (
                    <JsonFormField
                      field={formField}
                      label={actualField.label}
                      schema={actualField.schema}
                      required={actualField.required}
                      disabled={actualField.disabled}
                    />
                  )}
                  {actualField.type === "file" && (
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
                  {actualField.type === "switch" && (
                    <Switch
                      id={actualField.key}
                      value={formField?.value || "No"}
                      label=""
                      onChange={(value: any) => {
                        formField.onChange(value);
                      }}
                    />
                  )}
                  {actualField.type === "number" && (
                    <Input
                      type="number"
                      {...formField}
                      placeholder={
                        actualField.placeholder || "Select an option..."
                      }
                      className="border p-2 w-full bg-gray-200"
                      disabled={isFixedParent || actualField.disabled}
                      onChange={(e) =>
                        formField.onChange(Number(e.target.value))
                      }
                    />
                  )}
                  {actualField.type === "textarea" && (
                    <Textarea
                      {...formField}
                      placeholder={
                        actualField.placeholder || "Select an option..."
                      }
                      className="border p-2 w-full"
                      disabled={isFixedParent || actualField.disabled}
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
    },
    [syncProcessor, fixedParents, form.control]
  );

  const createNestedPath = (
    parentPath: string,
    childKey: string,
    index?: number
  ): string => {
    if (!parentPath) return childKey;
    if (typeof index === "number") {
      return `${parentPath}[${index}].${childKey}`;
    }
    return `${parentPath}.${childKey}`;
  };

  // Recursive function to render nested fields
  const renderNestedField = (
    field: NestedFieldConfig,
    parentPath: string = "",
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

    if (field.containerType === "array") {
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
              {field.arrayConfig?.addButtonText || "Add Item"}
            </Button>
          </div>

          <div className="space-y-4">
            {arrayItems.map((itemIndex, index) => (
              <div
                key={`${currentPath}-${itemIndex}`}
                className="relative border rounded-lg p-4"
                style={{ background: "var(--surface-50)" }}
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
                    {field.arrayConfig?.removeButtonText || "Remove"}
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
            background: "var(--surface-50)",
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
      parentPath: string = ""
    ) => {
      // Process nested children first
      if (field.sync && !syncProcessor.isFieldVisible(field.key)) {
        return;
      }

      const dynamicField = syncProcessor.getDynamicField(field.key);
      const actualField: any = dynamicField || field;

      if (actualField.children) {
        actualField.children = actualField.children.map((child: any) => ({
          ...child,
          parentPath: createNestedPath(parentPath, actualField.key),
          nestingLevel: (actualField.nestingLevel || 0) + 1,
        }));
      }

      // Then organize by tabs/sections (your existing logic)
      if (actualField.tabId) {
        //@ts-ignore
        if (!tabs[actualField.tabId]) {
          //@ts-ignore
          tabs[actualField.tabId] = {
            id: actualField.tabId,
            name: actualField.tabName || `${actualField.tabId}`,
            sections: {},
            ungroupedFields: [],
          };
        }

        if (actualField.expandableSectionId) {
          //@ts-ignore
          if (
            //@ts-ignore
            !tabs[actualField.tabId].sections[actualField.expandableSectionId]
          ) {
            //@ts-ignore
            tabs[actualField.tabId].sections[actualField.expandableSectionId] =
              {
                id: actualField.expandableSectionId,
                name:
                  actualField.expandableSectionName ||
                  `${actualField.expandableSectionId}`,
                fields: [],
              };
          }
          //@ts-ignore
          tabs[actualField.tabId].sections[
            actualField.expandableSectionId
          ].fields.push(actualField);
        } else {
          //@ts-ignore
          tabs[actualField.tabId].ungroupedFields.push(actualField);
        }
      } else if (actualField.expandableSectionId) {
        ungroupedFields.push(actualField);
      } else {
        ungroupedFields.push(actualField);
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
        style={{ background: "var(--background)" }}
      >
        <div
          className="w-full px-10 pt-8 pb-6"
          style={{
            background: "var(--surface-100)",
            borderBottom: "1px solid var(--border)",
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
                          style={{ background: "var(--surface-100)" }}
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
                                  style={{ background: "var(--surface-100)" }}
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

              <div className="flex sticky bottom-0 w-full bg-background justify-end gap-3 pt-2 pb-2 border-t border-border">
                {/* Save & Continue Editing Button */}
                <Button
                  type="button"
                  className="group relative px-6 py-2.5 rounded-md font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:scale-100 disabled:hover:shadow-none"
                  style={{
                    background:
                      putDetailsMutation.isPending ||
                      postDetailMutation.isPending ||
                      isSubmitting
                        ? "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)"
                        : "linear-gradient(135deg, #10b981 0%, #059669 100%)", // Green gradient
                    boxShadow:
                      "0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                  disabled={
                    putDetailsMutation.isPending ||
                    postDetailMutation.isPending ||
                    isSubmitting ||
                    !form.formState.isValid
                  }
                  onClick={form.handleSubmit((data) =>
                    onSubmit(data, "saveAndContinue")
                  )}
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
                      <HugeiconsIcon icon={Edit02Icon} size={`1rem`} />
                    )}
                    <span className="text-sm">
                      {putDetailsMutation.isPending ||
                      postDetailMutation.isPending ||
                      isSubmitting
                        ? "Processing..."
                        : "Save & Continue"}
                    </span>
                  </div>

                  {/* Shimmer effect for loading state */}
                  {(putDetailsMutation.isPending ||
                    postDetailMutation.isPending ||
                    isSubmitting) && (
                    <div
                      className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                      style={{ animation: "shimmer 2s infinite" }}
                    />
                  )}
                </Button>

                {/* Save & Add New Button */}
                <Button
                  type="button"
                  className="group relative px-6 py-2.5 rounded-md font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:scale-100 disabled:hover:shadow-none"
                  style={{
                    background:
                      putDetailsMutation.isPending ||
                      postDetailMutation.isPending ||
                      isSubmitting
                        ? "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)"
                        : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", // Purple gradient
                    boxShadow:
                      "0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                  disabled={
                    putDetailsMutation.isPending ||
                    postDetailMutation.isPending ||
                    isSubmitting ||
                    !form.formState.isValid
                  }
                  onClick={form.handleSubmit((data) =>
                    onSubmit(data, "saveAndAddNew")
                  )}
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
                      <HugeiconsIcon icon={Add01Icon} size={`1rem`} />
                    )}
                    <span className="text-sm">
                      {putDetailsMutation.isPending ||
                      postDetailMutation.isPending ||
                      isSubmitting
                        ? "Processing..."
                        : "Save & Add New"}
                    </span>
                  </div>

                  {/* Shimmer effect for loading state */}
                  {(putDetailsMutation.isPending ||
                    postDetailMutation.isPending ||
                    isSubmitting) && (
                    <div
                      className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                      style={{ animation: "shimmer 2s infinite" }}
                    />
                  )}
                </Button>

                {/* Original Submit Button */}
                <Button
                  type="submit"
                  className="group relative px-6 py-2.5 rounded-md font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:scale-100 disabled:hover:shadow-none"
                  style={{
                    background:
                      putDetailsMutation.isPending ||
                      postDetailMutation.isPending ||
                      isSubmitting
                        ? "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)"
                        : "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #2563eb) 100%)",
                    boxShadow:
                      "0 4px 12px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                  disabled={
                    putDetailsMutation.isPending ||
                    postDetailMutation.isPending ||
                    isSubmitting
                  }
                  onClick={form.handleSubmit((data) =>
                    onSubmit(data, "submit")
                  )}
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
                        ? "Processing..."
                        : "Submit Form"}
                    </span>
                  </div>

                  {/* Shimmer effect for loading state */}
                  {(putDetailsMutation.isPending ||
                    postDetailMutation.isPending ||
                    isSubmitting) && (
                    <div
                      className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                      style={{ animation: "shimmer 2s infinite" }}
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
