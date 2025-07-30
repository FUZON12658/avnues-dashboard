export interface NestedFieldConfig {
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

export interface SyncConfig {
  dependentOn?: string | string[]; // Field key(s) this field depends on
  followedBy?: string | string[]; // Field key(s) that follow this field
  dependencyType: "restriction" | "value_update" | "dynamicFieldGen";
  valueMaps?: {
    [key: string]: any; // Maps dependent field values to actions
  };
}

export interface FormFieldWithSync {
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


export interface FormData {
  [key: string]: any;
}

export interface DynamicFormProps {
  suppliedId?: string | null;
  fixedParents?: any;
  fetchLink?: any;
  formDataSupplied?: FormData;
}