"use client";
import { crAxios } from "@/api";
import FileUploader from "@/components/ui/fileuploader";
import JsonFormField from "@/components/ui/json-form-field";
import CustomJodit from "@/components/common/CustomJodit";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { capitalizeFirstLetter, formatDateInNepaliTimezone } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  QueryClient,
  useMutation,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import { X } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import Select from "react-select";
import { toast } from "sonner";
import { z } from "zod";
import { BodyText, Heading } from "@/components/common/typography";
import { uploadImageApi } from "@/api/uploadImage";
import MultiSelect from "@/components/ui/multi-select";
import Combobox from "@/components/ui/dropdown-menu";
import {
  CustomAccordion,
  CustomAccordionItem,
  CustomAccordionTrigger,
  CustomAccordionContent,
  CustomTabs,
  CustomTabsList,
  CustomTabsTrigger,
  CustomTabsContent,
} from "@/components/ui/custom-tab";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Edit02Icon,
  SentIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { EnhancedFileUploader } from "@/components/filemanager/file-picker-modal";
import {
  useDeepCompareEffect,
  useDeepCompareMemo,
} from "@/hooks/deepCompareMemo";

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
  sync?: any;
  // New properties for nested handling
  children?: NestedFieldConfig[];
  isNested?: boolean;
  parentPath?: string;
  nestingLevel?: number;
  containerType?: "object" | "array";
  arrayConfig?: {
    minItems?: number;
    maxItems?: number;
    addButtonText?: string;
    removeButtonText?: string;
  };
}

interface SyncConfig {
  dependentOn?: string | string[]; // Field key(s) this field depends on
  followedBy?: string | string[]; // Field key(s) that follow this field
  dependencyType: "restriction" | "value_update" | "dynamicFieldGen";
  valueMaps?: {
    [key: string]: any; // Maps dependent field values to actions
  };
}

interface FormFieldWithSync {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  disabled?: boolean;
  values?: any[];
  sync?: SyncConfig;
  // ... other existing properties
}
//working

const useSyncProcessor = (fields: FormFieldWithSync[], formValues: any) => {
  const [visibleFields, setVisibleFields] = React.useState<Set<string>>(
    new Set()
  );
  const [dynamicFields, setDynamicFields] = React.useState<
    Map<string, FormFieldWithSync>
  >(new Map());
  const [fieldOptions, setFieldOptions] = React.useState<Map<string, any[]>>(
    new Map()
  );
  const [fieldApiConfig, setFieldApiConfig] = React.useState<
    Map<
      string,
      { dataRoute: string; dataToShow: string[]; populatedKey: string }
    >
  >(new Map());

  // Helper function to extract value from form field
  const extractValue = (rawValue: any) => {
    if (rawValue === null || rawValue === undefined) return null;
    console.log("raw value here:");
    console.log(rawValue);
    console.log("raw value ended");
    // Handle object with value property (like from select components)
    if (typeof rawValue === "object" && rawValue.value !== undefined) {
      return rawValue.value;
    }

    return rawValue;
  };

  // Helper function to flatten nested fields and create a comprehensive field map
  const createFieldMap = (
    fields: any[],
    parentPath: string = ""
  ): Map<string, any> => {
    const fieldMap = new Map<string, FormFieldWithSync>();

    fields.forEach((field: any) => {
      const fullPath = parentPath
        ? `${parentPath}${
            isNaN(Number(field.key)) ? `.${field.key}` : `[${field.key}]`
          }`
        : field.key;
      fieldMap.set(fullPath, field);
      fieldMap.set(field.key, field); // Also store by simple key for lookup

      // Process children recursively
      if (field.children && field.children.length > 0) {
        const childMap = createFieldMap(field.children, fullPath);
        childMap.forEach((childField, childPath) => {
          fieldMap.set(childPath, childField);
        });
      }
    });

    return fieldMap;
  };

  // Helper function to get nested value from form values using dot notation
  const getNestedValue = (obj: any, path: string): any => {
    const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    return parts.reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  };

  // Helper function to find all possible paths for a field key in nested structures
  const findFieldPaths = (
    obj: any,
    targetKey: string,
    currentPath: string = ""
  ): string[] => {
    const paths: string[] = [];

    if (!obj || typeof obj !== "object") return paths;

    Object.keys(obj).forEach((key) => {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      if (key === targetKey) {
        paths.push(fullPath);
      }

      if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any, index: number) => {
          const arrayItemPath = `${fullPath}[${index}]`;
          paths.push(...findFieldPaths(item, targetKey, arrayItemPath));
        });
      } else if (typeof obj[key] === "object") {
        paths.push(...findFieldPaths(obj[key], targetKey, fullPath));
      }
    });

    return paths;
  };

  // Helper function to get field key variants for lookup
  const getFieldKeyVariants = (fieldKey: string) => {
    const variants = [fieldKey];
    if (fieldKey.includes(".")) {
      variants.push(fieldKey.split(".").pop()!);
    }
    return variants;
  };

  // Helper function to get the parent path context for dynamic field generation
  const getParentPathContext = (
    fieldPath: string,
    fieldKey: string
  ): string => {
    if (fieldPath === fieldKey) {
      return ""; // No parent context for simple keys
    }
    // Remove the field key from the end to get parent context
    const regex = new RegExp(
      `[\\.\\[]${fieldKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]?$`
    );
    return fieldPath.replace(regex, "");
  };

  // Memoize the processing to prevent unnecessary re-calculations
  const processedData = useDeepCompareMemo(() => {
    console.log("🔄 Processing sync effects...");
    console.log("📝 Form values:", formValues);

    const fieldMap = createFieldMap(fields);
    const newVisibleFields = new Set<string>();
    const newDynamicFields = new Map<string, FormFieldWithSync>();
    const newFieldOptions = new Map<string, any[]>();
    const newFieldApiConfig = new Map<
      string,
      { dataRoute: string; dataToShow: string[]; populatedKey: string }
    >();

    // Initialize all fields as visible by default (fields without sync or dependentOn)
    fieldMap.forEach((field, path) => {
      if (!field.sync?.dependentOn) {
        newVisibleFields.add(path);
        if (path !== field.key) {
          newVisibleFields.add(field.key); // Also add simple key
        }
        console.log(`✅ Adding field as visible (no dependentOn): ${path}`);
      }
    });

    // Process each field's sync configuration
    fieldMap.forEach((field, fieldPath) => {
      if (!field.sync) {
        newVisibleFields.add(fieldPath);
        if (fieldPath !== field.key) {
          newVisibleFields.add(field.key);
        }
        return;
      }

      const sync = field.sync;
      console.log(`🔍 Processing field: ${fieldPath} (${field.key})`, sync);

      // Handle fields that depend on other fields (DEPENDENT FIELDS)
      if (sync.dependentOn) {
        const dependentKeys = Array.isArray(sync.dependentOn)
          ? sync.dependentOn
          : [sync.dependentOn];

        dependentKeys.forEach((dependentKey: any) => {
          // For nested structures, find all possible paths
          const dependentPaths = findFieldPaths(formValues, dependentKey);

          // Also check direct field access for simple cases
          if (
            dependentPaths.length === 0 &&
            formValues[dependentKey] !== undefined
          ) {
            dependentPaths.push(dependentKey);
          }

          dependentPaths.forEach((dependentPath) => {
            const dependentValue = extractValue(
              getNestedValue(formValues, dependentPath)
            );

            console.log(
              `📊 Dependent key: ${dependentKey} at path: ${dependentPath}, extracted value:`,
              dependentValue
            );

            if (dependentValue && sync.valueMaps?.[dependentValue]) {
              const valueMap = sync.valueMaps[dependentValue];
              console.log(
                `🗺️ Found value map for ${dependentValue}:`,
                valueMap
              );
              console.log(`processing dependent value: ${dependentValue}`);
              switch (sync.dependencyType) {
                case "restriction":
                  if (valueMap.show?.includes(field.key)) {
                    newVisibleFields.add(fieldPath);
                    newVisibleFields.add(field.key);
                  }
                  // if (valueMap.hide?.includes(field.key)) {
                  //   newVisibleFields.delete(fieldPath);
                  //   newVisibleFields.delete(field.key);
                  // }
                  break;

                case "value_update":
                  newVisibleFields.add(fieldPath);
                  newVisibleFields.add(field.key);

                  if (valueMap.options) {
                    newFieldOptions.set(fieldPath, valueMap.options);
                    newFieldOptions.set(field.key, valueMap.options);
                    console.log(
                      `🎛️ Setting options for ${fieldPath}:`,
                      valueMap.options
                    );
                  } else if (valueMap.updateField) {
                    const updateField = valueMap.updateField;

                    // Handle API configuration
                    if (updateField.dataRoute && updateField.dataToShow) {
                      const apiConfig = {
                        dataRoute: updateField.dataRoute,
                        dataToShow: updateField.dataToShow,
                        populatedKey: updateField.populatedKey || field.key,
                      };

                      // Store API config for the current field (the one being updated)
                      newFieldApiConfig.set(fieldPath, apiConfig);
                      newFieldApiConfig.set(field.key, apiConfig);
                      console.log(
                        `🌐 Setting API config for dependent field ${fieldPath}:`,
                        apiConfig
                      );
                    }

                    // Handle static values from updateField
                    if (updateField.values) {
                      const staticOptions = updateField.values.map(
                        (option: any) => ({
                          value: option.value || option.Value,
                          label: option.label || option.Label,
                        })
                      );
                      newFieldOptions.set(fieldPath, staticOptions);
                      newFieldOptions.set(field.key, staticOptions);
                      console.log(
                        `🎛️ Setting updateField static options for ${fieldPath}:`,
                        staticOptions
                      );
                    }
                  }
                  break;

                case "dynamicFieldGen":
                  console.log(`🏗️ Dynamic field gen for: ${fieldPath}`);
                  if (valueMap.generateField) {
                    const dynamicField = {
                      ...valueMap.generateField,
                      key: field.key,
                    };

                    // Get the parent context from the dependent field path
                    const parentContext = getParentPathContext(
                      dependentPath,
                      dependentKey
                    );
                    const dynamicFieldPath = parentContext
                      ? `${parentContext}.${dynamicField.key}`
                      : dynamicField.key;
                    console.log(dynamicFieldPath);
                    console.log("Bryangaman here");
                    // Also add the base path without array indices for general visibility
                    const baseParentContext = parentContext.replace(
                      /\[\d+\]/g,
                      ""
                    );
                    const baseDynamicFieldPath = baseParentContext
                      ? `${baseParentContext}.${dynamicField.key}`
                      : dynamicField.key;

                    dynamicField.key = baseDynamicFieldPath;
                    newDynamicFields.set(dynamicFieldPath, dynamicField);
                    newDynamicFields.set(dynamicField.key, dynamicField);
                    newDynamicFields.set(baseDynamicFieldPath, dynamicField);

                    newVisibleFields.add(dynamicFieldPath);
                    newVisibleFields.add(dynamicField.key);
                    newVisibleFields.add(baseDynamicFieldPath);

                    console.log(
                      `✨ Generated dynamic field for ${dynamicFieldPath} and ${baseDynamicFieldPath}:`,
                      dynamicField
                    );
                  } else {
                    // Remove dynamic field when no generateField is specified
                    const parentContext = getParentPathContext(
                      dependentPath,
                      dependentKey
                    );
                    const dynamicFieldPath = parentContext
                      ? `${parentContext}.${field.key}`
                      : field.key;

                    const baseParentContext = parentContext.replace(
                      /\[\d+\]/g,
                      ""
                    );
                    const baseDynamicFieldPath = baseParentContext
                      ? `${baseParentContext}.${field.key}`
                      : field.key;

                    newDynamicFields.delete(dynamicFieldPath);
                    newDynamicFields.delete(field.key);
                    newDynamicFields.delete(baseDynamicFieldPath);

                    newVisibleFields.delete(dynamicFieldPath);
                    newVisibleFields.delete(field.key);
                    newVisibleFields.delete(baseDynamicFieldPath);

                    console.log(
                      `🗑️ Removed dynamic field for ${dynamicFieldPath} and ${baseDynamicFieldPath}`
                    );
                  }
                  break;
              }
            } else {
              // Handle case when dependent value is empty or not found
              if (sync.dependencyType === "value_update") {
                newVisibleFields.add(fieldPath);
                newVisibleFields.add(field.key);
                // Clear options and API config when no dependent value
                newFieldOptions.delete(fieldPath);
                newFieldOptions.delete(field.key);
                newFieldApiConfig.delete(fieldPath);
                newFieldApiConfig.delete(field.key);
                console.log(
                  `🧹 Cleared options and API config for ${fieldPath} (no dependent value)`
                );
              } else if (sync.dependencyType === "dynamicFieldGen") {
                // DON'T automatically remove dynamic fields when no dependent value
                // Only remove if the field was previously generated and now shouldn't be
                // This requires tracking the previous state or being more selective

                // Instead of aggressive cleanup, only clean up if we're sure the field shouldn't exist
                console.log(
                  `⚠️ No dependent value found for dynamic field gen: ${fieldPath}`
                );

                // Optional: Only clean up if this is a state change (field was visible before but shouldn't be now)
                // This requires more sophisticated state tracking
              }
            }
          });
        });
      }

      // Handle fields that control other fields (PARENT FIELDS)
      if (sync.followedBy) {
        const followedKeys = Array.isArray(sync.followedBy)
          ? sync.followedBy
          : [sync.followedBy];

        // Find all instances of this field in the form
        const fieldPaths = findFieldPaths(formValues, field.key);

        // Also check direct field access for simple cases
        if (fieldPaths.length === 0 && formValues[field.key] !== undefined) {
          fieldPaths.push(field.key);
        }

        fieldPaths.forEach((currentFieldPath) => {
          const currentValue = extractValue(
            getNestedValue(formValues, currentFieldPath)
          );
          console.log(
            `📊 Current value of parent ${field.key} at ${currentFieldPath}:`,
            currentValue
          );
          console.log(currentValue);
          console.log("current value just before current value");
          let currentVal = Array.isArray(currentValue)
            ? currentValue
            : [currentValue];
          currentVal.forEach((currentValue) => {
            if (currentValue && sync.valueMaps?.[currentValue]) {
              console.log(`processing current value: ${currentValue}`);
              const valueMap = sync.valueMaps[currentValue];
              console.log("current value just before current value 2");
              switch (sync.dependencyType) {
                case "restriction":
                  valueMap.show?.forEach((key: string) => {
                    // Find the correct context for the controlled field
                    const parentContext = getParentPathContext(
                      currentFieldPath,
                      field.key
                    );
                    const controlledFieldPath = parentContext
                      ? `${parentContext}.${key}`
                      : key;

                    newVisibleFields.add(controlledFieldPath);
                    newVisibleFields.add(key);
                  });
                  // valueMap.hide?.forEach((key: string) => {
                  //   const parentContext = getParentPathContext(
                  //     currentFieldPath,
                  //     field.key
                  //   );
                  //   const controlledFieldPath = parentContext
                  //     ? `${parentContext}.${key}`
                  //     : key;

                  //   newVisibleFields.delete(controlledFieldPath);
                  //   newVisibleFields.delete(key);
                  // });
                  break;

                case "value_update":
                  followedKeys.forEach((followedKey: any) => {
                    // Find the correct path for the followed field in the same context
                    const parentContext = getParentPathContext(
                      currentFieldPath,
                      field.key
                    );
                    const followedFieldPath = parentContext
                      ? `${parentContext}.${followedKey}`
                      : followedKey;

                    newVisibleFields.add(followedFieldPath);
                    newVisibleFields.add(followedKey);

                    if (valueMap.options) {
                      newFieldOptions.set(followedFieldPath, valueMap.options);
                      newFieldOptions.set(followedKey, valueMap.options);
                      console.log(
                        `🎛️ Setting options for controlled field ${followedFieldPath}:`,
                        valueMap.options
                      );
                    } else if (valueMap.updateField) {
                      const updateField = valueMap.updateField;

                      // Handle API configuration for followed fields
                      if (updateField.dataRoute && updateField.dataToShow) {
                        const apiConfig = {
                          dataRoute: updateField.dataRoute,
                          dataToShow: updateField.dataToShow,
                          populatedKey: updateField.populatedKey || followedKey,
                        };

                        // Store API config for the followed field
                        newFieldApiConfig.set(followedFieldPath, apiConfig);
                        newFieldApiConfig.set(followedKey, apiConfig);
                        console.log(
                          `🌐 Setting API config for followed field ${followedFieldPath}:`,
                          apiConfig
                        );
                      }

                      // Handle static values from updateField for followed fields
                      if (updateField.values) {
                        const staticOptions = updateField.values.map(
                          (option: any) => ({
                            value: option.value || option.Value,
                            label: option.label || option.Label,
                          })
                        );
                        newFieldOptions.set(followedFieldPath, staticOptions);
                        newFieldOptions.set(followedKey, staticOptions);
                        console.log(
                          `🎛️ Setting updateField static options for followed field ${followedFieldPath}:`,
                          staticOptions
                        );
                      }
                    }
                  });
                  break;

                case "dynamicFieldGen":
                  followedKeys.forEach((followedKey: any) => {
                    if (valueMap.generateField) {
                      const dynamicField = {
                        ...valueMap.generateField,
                      };

                      // Use the parent context from the current field path
                      const parentContext = getParentPathContext(
                        currentFieldPath,
                        field.key
                      );
                      const dynamicFieldPath = parentContext
                        ? `${parentContext}.${dynamicField.key}`
                        : dynamicField.key;
                      // Also add the base path without array indices
                      const baseParentContext = parentContext.replace(
                        /\[\d+\]/g,
                        ""
                      );
                      const baseDynamicFieldPath = baseParentContext
                        ? `${baseParentContext}.${dynamicField.key}`
                        : dynamicField.key;
                      dynamicField.key = dynamicFieldPath;
                      newDynamicFields.set(dynamicFieldPath, dynamicField);
                      newDynamicFields.set(dynamicField.key, dynamicField);
                      newDynamicFields.set(baseDynamicFieldPath, dynamicField);

                      newVisibleFields.add(dynamicFieldPath);
                      newVisibleFields.add(dynamicField.key);
                      newVisibleFields.add(baseDynamicFieldPath);

                      console.log(
                        `✨ Generated dynamic field for ${dynamicFieldPath} and ${baseDynamicFieldPath}:`,
                        dynamicField
                      );
                    } else {
                      const parentContext = getParentPathContext(
                        currentFieldPath,
                        field.key
                      );
                      const dynamicFieldPath = parentContext
                        ? `${parentContext}.${followedKey}`
                        : followedKey;

                      const baseParentContext = parentContext.replace(
                        /\[\d+\]/g,
                        ""
                      );
                      const baseDynamicFieldPath = baseParentContext
                        ? `${baseParentContext}.${followedKey}`
                        : followedKey;

                      newDynamicFields.delete(dynamicFieldPath);
                      newDynamicFields.delete(followedKey);
                      newDynamicFields.delete(baseDynamicFieldPath);

                      newVisibleFields.delete(dynamicFieldPath);
                      newVisibleFields.delete(followedKey);
                      newVisibleFields.delete(baseDynamicFieldPath);

                      console.log(
                        `🗑️ Removed dynamic field for ${dynamicFieldPath} and ${baseDynamicFieldPath}`
                      );
                    }
                  });
                  break;
              }
            } else {
              // Clear options/fields for controlled fields when parent has no value
              if (sync.dependencyType === "value_update") {
                followedKeys.forEach((followedKey: any) => {
                  const parentContext = getParentPathContext(
                    currentFieldPath,
                    field.key
                  );
                  const followedFieldPath = parentContext
                    ? `${parentContext}.${followedKey}`
                    : followedKey;

                  newVisibleFields.add(followedFieldPath);
                  newVisibleFields.add(followedKey);
                  // Clear both options and API config
                  newFieldOptions.delete(followedFieldPath);
                  newFieldOptions.delete(followedKey);
                  newFieldApiConfig.delete(followedFieldPath);
                  newFieldApiConfig.delete(followedKey);
                  console.log(
                    `🧹 Cleared options and API config for controlled field ${followedFieldPath} (no parent value)`
                  );
                });
              } else if (sync.dependencyType === "dynamicFieldGen") {
                followedKeys.forEach((followedKey: any) => {
                  const parentContext = getParentPathContext(
                    currentFieldPath,
                    field.key
                  );
                  const baseParentContext = parentContext.replace(
                    /\[\d+\]/g,
                    ""
                  );

                  // Clean up any dynamic fields that might have been generated
                  newDynamicFields.forEach((dynamicField, path) => {
                    const pathContext = parentContext
                      ? `${parentContext}.`
                      : "";
                    const basePathContext = baseParentContext
                      ? `${baseParentContext}.`
                      : "";

                    if (
                      (path.startsWith(pathContext) ||
                        path.startsWith(basePathContext)) &&
                      path.includes(followedKey)
                    ) {
                      newDynamicFields.delete(path);
                      newVisibleFields.delete(path);
                    }
                  });

                  // Also clean up simple key references
                  newDynamicFields.delete(followedKey);
                  newVisibleFields.delete(followedKey);

                  // Clean up base path references
                  const baseDynamicFieldPath = baseParentContext
                    ? `${baseParentContext}.${followedKey}`
                    : followedKey;
                  newDynamicFields.delete(baseDynamicFieldPath);
                  newVisibleFields.delete(baseDynamicFieldPath);

                  console.log(
                    `🗑️ Removed dynamic field for ${followedKey} and ${baseDynamicFieldPath} (no parent value)`
                  );
                });
              }
            }
          });
        });
      }
    });

    console.log("🔍 Final processing results:");
    console.log("👁️ Visible fields:", Array.from(newVisibleFields));
    console.log("🎭 Dynamic fields:", Array.from(newDynamicFields.keys()));
    console.log("🎛️ Field options:", Array.from(newFieldOptions.keys()));
    console.log("🌐 Field API configs:", Array.from(newFieldApiConfig.keys()));

    return {
      visibleFields: newVisibleFields,
      dynamicFields: newDynamicFields,
      fieldOptions: newFieldOptions,
      fieldApiConfig: newFieldApiConfig,
    };
  }, [fields, formValues]);

  // Update state when processed data changes
  React.useEffect(() => {
    setVisibleFields(processedData.visibleFields);
    setDynamicFields(processedData.dynamicFields);
    setFieldOptions(processedData.fieldOptions);
    setFieldApiConfig(processedData.fieldApiConfig);
  }, [processedData]);

  return {
    visibleFields: processedData.visibleFields,
    dynamicFields: processedData.dynamicFields,
    fieldOptions: processedData.fieldOptions,
    fieldApiConfig: processedData.fieldApiConfig,
    isFieldVisible: (fieldKey: string) => {
      // Check both full key and short key variants
      const variants = getFieldKeyVariants(fieldKey);
      return variants.some((variant) =>
        processedData.visibleFields.has(variant)
      );
    },
    getDynamicField: (fieldKey: string) => {
      // Check both full key and short key variants
      const variants = getFieldKeyVariants(fieldKey);
      for (const variant of variants) {
        const dynamicField = processedData.dynamicFields.get(variant);
        if (dynamicField) {
          return dynamicField;
        }
      }
      return null;
    },
    getFieldOptions: (fieldKey: string) => {
      // Check both full key and short key variants
      const variants = getFieldKeyVariants(fieldKey);
      for (const variant of variants) {
        const options = processedData.fieldOptions.get(variant);
        if (options) {
          return options;
        }
      }
      return null;
    },
    getFieldApiConfig: (fieldKey: string) => {
      const variants = getFieldKeyVariants(fieldKey);
      for (const variant of variants) {
        const apiConfig = processedData.fieldApiConfig.get(variant);
        if (apiConfig) {
          return apiConfig;
        }
      }
      return null;
    },
    hasApiConfig: (fieldKey: string) => {
      //@ts-ignore
      return !!this.getFieldApiConfig(fieldKey);
    },
  };
};

const isImageFile = (fileNameOrUrl?: string) => {
  if (!fileNameOrUrl || typeof fileNameOrUrl !== "string") return false; // Ensure it's a valid string

  const imageExtensions = ["png", "jpg", "jpeg", "webp", "svg"];

  try {
    const url = new URL(fileNameOrUrl); // Check if it's a valid URL
    const decodedPath = decodeURIComponent(url.pathname.toLowerCase()); // Decode and normalize
    return imageExtensions.some((ext) => decodedPath.endsWith(`.${ext}`));
  } catch (e) {
    // Not a valid URL, treat it as a filename
    const fileExtension = fileNameOrUrl.split(".").pop()?.toLowerCase();
    return fileExtension ? imageExtensions.includes(fileExtension) : false;
  }
};

function formatTitle(title: string) {
  return title
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  const [submitFormState, setSubmitFormState] = React.useState("submit");
  const router = useRouter();
  const { slug } = useParams();
  const pathname = usePathname();
  const [showPassword, setShowPassword] = React.useState(false);
  const [files, setFiles] = React.useState<Record<string, File[]>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formReady, setFormReady] = React.useState({});
  const queryClient = new QueryClient();
  const [stableDynamicFields, setStableDynamicFields] = React.useState<
    Map<string, any>
  >(new Map());
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
      processedLink = processedLink.replace("{id}", item.id.toString());
    } else if (suppliedId !== null && suppliedId !== undefined) {
      processedLink = processedLink.replace("{id}", suppliedId.toString());
    }

    if (slug !== undefined) {
      processedLink = processedLink.replace("{slug}", slug.toString());
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
    sortOrder: "ASC" | "DESC" = "DESC"
  ) => {
    const response = await crAxios.get(`/api/v1/${slug}`, {
      params: { limit, offset, sort: sortOrder },
    });
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
    onError: () => {
      setIsSubmitting(false);
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
    queryFn: () => getDetailsApi(1, 0, "DESC"),
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
  const formValues = form.watch();

  const syncProcessor = useSyncProcessor(
    viewData?.displayModel?.formFields || [],
    formValues
  );
  const {
    visibleFields,
    dynamicFields,
    fieldOptions,
    isFieldVisible,
    getDynamicField,
    getFieldOptions,
  } = useSyncProcessor(
    viewData?.displayModel?.formFields || [], // The form field configuration
    formValues // Current form values
  );
  const dataFilledRef = React.useRef(false);

  React.useEffect(() => {
    // Update stable dynamic fields in a separate effect to avoid render-time changes
    setStableDynamicFields(new Map(dynamicFields));
  }, [dynamicFields]);

  React.useEffect(() => {
    if (viewData && !dataFilledRef.current && formDataSupplied) {
      const newDefaultValues = viewData.displayModel.formFields.reduce(
        //@ts-expect-error nothing just bullshit typescript showing bullshit warnings
        (acc, { key, type, populatedKey }) => {
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
            console.log(
              `File field ${key}: using ${dataKey}, value:`,
              acc[key]
            );
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
            console.log(key);
            console.log("Here single select static key");
            const value = formDataSupplied?.[key];
            acc[key] = value;
          } else if (type === "multiselectstatic") {
            console.log(key);
            console.log("Here single select static key");
            const value = formDataSupplied?.[key];
            acc[key] = value;
          } else if (type === "time") {
            acc[key] = formDataSupplied?.[key] ?? "";
          } else if (type === "date") {
            const dateValue = formDataSupplied?.[key];
            acc[key] = dateValue
              ? new Date(dateValue).toISOString().split("T")[0]
              : "";
          } else {
            console.log(key);

            acc[key] = formDataSupplied?.[key] ?? "";
          }
          return acc;
        },
        {}
      );
      console.log(newDefaultValues);
      console.log("New default values");
      form.reset(newDefaultValues); // ✅ Dynamically update form values
      if (newDefaultValues) {
        setFormReady(newDefaultValues);
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

    console.log("🔄 MultiSelect fields updated:");
    console.log("📋 Static fields:", staticFields.length);
    console.log("✨ Dynamic fields:", dynamicMultiSelectFields.length);

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
  const transformQueryData = React.useCallback((data, dataToShow) => {
    if (!data || data.length <= 0 || !dataToShow) return [{}];
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

      console.log("Field Value IDs:", fieldValueIds);
      console.log("Matching Values:", matchingValues);

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
      console.log("🔄 Data update triggered for:", key);
      setMultiSelectData((prev) => {
        const newData = {
          ...prev,
          [key]: transformedData,
        };

        // Clean up data for fields that are no longer visible
        const currentFieldKeys = multiSelectFields.map((f) => f.key);
        Object.keys(newData).forEach((dataKey) => {
          if (!currentFieldKeys.includes(dataKey)) {
            console.log("🧹 Cleaning up data for removed field:", dataKey);
            //@ts-ignore
            delete newData[dataKey];
          }
        });

        // If all current fields have data, mark as filled
        if (isDataComplete(newData)) {
          dataFilledRef.current = true;
        }

        return newData;
      });
    },
    [isDataComplete, multiSelectFields]
  );

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
      console.log(
        "🔄 Data update with validation for:",
        key,
        "original field:",
        originalFieldKey
      );

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
            console.log("🧹 Cleaning up data for removed field:", dataKey);
            //@ts-ignore
            delete newData[dataKey];
          }
        });

        // Log the update for debugging
        console.log("📊 MultiSelect data updated:", {
          key,
          dataLength: transformedData.length,
          totalKeys: Object.keys(newData).length,
        });

        return newData;
      });
    },
    [multiSelectFields, syncProcessor]
  );

  const queriesConfig = useDeepCompareMemo(() => {
    if (!viewData || !multiSelectFields.length) return [];

    console.log(
      "🔄 Rebuilding queries config for fields:",
      multiSelectFields.map((f) => f.key)
    );

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
              console.log(
                `🌐 Fetching dynamic data for ${key} from:`,
                dynamicConfig.dataRoute
              );
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
              console.log(
                `✅ Dynamic data loaded for ${key}:`,
                data.mainData?.length || 0,
                "items"
              );
              const transformedData = transformQueryData(
                data.mainData,
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
              console.log("🌐 Fetching API config data from:", finalDataRoute);
              return getDataFromRoute(processLink(finalDataRoute, null));
            },
            enabled: !!(viewData && finalDataRoute && visibleFields.has(key)),
            staleTime: 5 * 60 * 1000,
            retry: 3,
            retryDelay: (attemptIndex: any) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            onSuccess: (data: any) => {
              if (!data) return;
              console.log(
                `✅ API config data loaded for ${key}:`,
                data.mainData?.length || 0,
                "items"
              );
              const transformedData = transformQueryData(
                data.mainData,
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
            console.log("🌐 Fetching static data from:", finalDataRoute);
            return getDataFromRoute(processLink(finalDataRoute, null));
          },
          enabled: !!(viewData && finalDataRoute && visibleFields.has(key)),
          staleTime: Infinity,
          onSuccess: (data: any) => {
            if (!data) return;
            console.log(
              `✅ Static data loaded for ${key}:`,
              data.mainData?.length || 0,
              "items"
            );
            const transformedData = transformQueryData(
              data.mainData,
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
      console.log(
        `📊 Processing ${allQueriesWithData.length} successful queries`
      );

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
      console.log("🔄 API config changed, invalidating related queries");

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
        if (field.containerType === "array") {
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
        !key.includes(".") &&
        !key.includes("[") &&
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
  const onSubmit = async (data, action) => {
    try {
      const data = form.getValues();
      setIsSubmitting(true);
      setSubmitFormState(action);
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
          } else         if (
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
          console.log("date magaman");
          console.log(value);

          //@ts-ignore
          processedData[key] = new Date(value).toISOString(); // This gives you the UTC date in ISO 8601 format
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

      console.log("final Data here");
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
      console.error("Form submission error:", error);
      toast.error("An error occurred when saving the data");
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

  const renderFormField = React.useCallback(
    (field: any) => {
      console.log(`🎨 Rendering field: ${field.key}`);

      // Check visibility
      if (
        field.sync &&
        !syncProcessor.isFieldVisible(field.key) &&
        !syncProcessor.isFieldVisible(field.key.split(".").pop()!)
      ) {
        console.log(`❌ Field ${field.key} is not visible, skipping render`);
        return null;
      }

      console.log(`✅ Field ${field.key} is visible, proceeding with render`);

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
            console.log(`✅ Found API data for ${field.key} under key: ${key}`);
            return data;
          }
        }

        console.log(
          `⚠️ No API data found for ${field.key}, checked keys:`,
          keys
        );
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
          console.log(
            `🎛️ Using sync options for ${field.key}:`,
            syncOptions.length
          );
          return syncOptions;
        }

        if (apiConfig && apiDataOptions.length > 0) {
          console.log(
            `🌐 Using API data options for ${field.key}:`,
            apiDataOptions.length
          );
          return apiDataOptions;
        }
        
        console.log(`📝 No dynamic options for ${field.key}`);
        return null;
      })();

      // Log the final options being used
      if (dynamicOptions && dynamicOptions.length > 0) {
        console.log(dynamicOptions)
        console.log("dynamic options here");
        dynamicOptions.filter((option:any)=>
        {return option.value !== suppliedId})
      }

      // Get dynamic field configuration
      let actualField =
        syncProcessor.getDynamicField(field.key) ||
        syncProcessor.getDynamicField(field.key.split(".").pop()!) ||
        field;
     
      const isFixedParent = isFixedParentField(actualField.key, fixedParents);
      const parentData = getFixedParentData(actualField.key, fixedParents);
       console.log(actualField.key);
      console.log(isFixedParent);
      console.log("isFixedparent here");

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
              formReady[actualField.key]
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

          console.log(fieldValues);
          console.log(actualField.key);
          console.log("Here multiselectstatic fieldvalues");

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
              <FormLabel>
                <BodyText variant="trimmed"> {actualField.label}</BodyText>
                {actualField.required && (
                  <span className="text-red-500 ml-1 text-xl font-bold">*</span>
                )}
              </FormLabel>
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
                        editorStyles="min-width:100% !important;"
                      />
                    </div>
                  )}
                  {actualField.type === "multiselect" && multiselectData && (
                    <MultiSelect
                      key={`${actualField.key}-${
                        multiselectData.fieldOptions?.length || 0
                      }`}
                      options={multiselectData.fieldOptions.filter((option:any) => option.value !== suppliedId) || []}
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
                          : [])
                          .filter((option:any) => option.value !== suppliedId)
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
                          :formField.value
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
      console.log(field.key);
      console.log("Here dynamic field and key");
      const dynamicField = syncProcessor.getDynamicField(field.key);
      console.log(dynamicField);
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
