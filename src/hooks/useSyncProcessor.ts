import React from "react";
import { FormFieldWithSync } from "@/types/NestedFieldConfig";
import { useDeepCompareMemo } from "./useDeepCompareMemo";

export const useSyncProcessor = (fields: FormFieldWithSync[], formValues: any) => {
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
            if (dependentValue && sync.valueMaps?.[dependentValue]) {
              const valueMap = sync.valueMaps[dependentValue];
              switch (sync.dependencyType) {
                case "restriction":
                  if (valueMap.show?.includes(field.key)) {
                    newVisibleFields.add(fieldPath);
                    newVisibleFields.add(field.key);
                  }
                  break;

                case "value_update":
                  newVisibleFields.add(fieldPath);
                  newVisibleFields.add(field.key);

                  if (valueMap.options) {
                    newFieldOptions.set(fieldPath, valueMap.options);
                    newFieldOptions.set(field.key, valueMap.options);
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
                    }
                  }
                  break;

                case "dynamicFieldGen":
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
              } else if (sync.dependencyType === "dynamicFieldGen") {
                // DON'T automatically remove dynamic fields when no dependent value
                // Only remove if the field was previously generated and now shouldn't be
                // This requires tracking the previous state or being more selective

                // Instead of aggressive cleanup, only clean up if we're sure the field shouldn't exist

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
          let currentVal = Array.isArray(currentValue)
            ? currentValue
            : [currentValue];
          currentVal.forEach((currentValue) => {
            if (currentValue && sync.valueMaps?.[currentValue]) {
              const valueMap = sync.valueMaps[currentValue];
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