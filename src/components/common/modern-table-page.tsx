'use client';
import React, { useState, useMemo, ReactNode } from 'react';
import {
  FilterIcon,
  Add01Icon,
  CancelCircleIcon,
  Search01Icon,
  Calendar01Icon,
  User03Icon,
  Tag01Icon,
  Dollar01Icon,
  MoreHorizontalCircle01Icon,
  ChartLineData01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  InformationCircleIcon,
  QuestionIcon,
  Edit01Icon,
  Edit02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import axios from 'axios';

// Import your existing UI components
import Combobox from '@/components/ui/dropdown-menu';
import { FileUploader } from '@/components/ui/fileuploader';
import { Input, IconInput } from '@/components/ui/input';
import MultiSelect from '@/components/ui/multi-select';
import IconCombobox from '@/components/ui/icon-dropdown-menu';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export type IconSvgObject =
  | [
      string,
      {
        [key: string]: string | number;
      }
    ][]
  | readonly (readonly [
      string,
      {
        readonly [key: string]: string | number;
      }
    ])[];
// Type Definitions

// Variant type for better type safety
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}

interface ProjectData {
  id: string;
  name: string;
  status: 'In Progress' | 'Completed' | 'Pending' | 'On Hold';
  category: string;
  amount: number;
  date: string;
  assignee: string;
  progress: number;
}

interface StatConfig {
  id: string;
  label: string;
  icon: IconSvgElement;
  color: 'blue' | 'orange' | 'green' | 'purple' | 'red' | 'gray';
  getValue?: (data: ProjectData[]) => number;
  format?: (value: number) => string;
}

interface HeaderButton {
  type: 'filter' | 'primary' | 'secondary';
  label: string;
  icon: IconSvgElement;
  action: string;
}

interface HeaderConfig {
  title: string;
  subtitle: string;
  buttons: HeaderButton[];
}

interface Option {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface FilterProps {
  placeholder?: string;
  options?: Option[];
  type?: string;
  leftIcon?: ReactNode;
  inputProps?: Record<string, any>;
  icon?: IconSvgElement;
}

interface FilterConfig {
  id: string;
  type:
    | 'iconInput'
    | 'select'
    | 'multiselect'
    | 'iconCombobox'
    | 'input'
    | 'textarea';
  label: string;
  component:
    | 'Input'
    | 'IconInput'
    | 'Combobox'
    | 'MultiSelect'
    | 'Textarea'
    | 'FileUploader'
    | 'IconCombobox';
  props: FilterProps;
}
interface ActionType {
  type: 'button' | 'checkbox' | 'switch';
  label: string;
  variant: string;
  onClick?: () => void;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}
interface MainTableActionType {
  label: string;
  variant: ButtonVariant;
  link: string;
  color?: string;
  icon?: string;
  tooltip?: string;
}

// Updated TableColumn interface with mainTableActions
interface TableColumn {
  key: keyof ProjectData | 'actions' | 'maintableactions';
  label: string;
  type:
    | 'text'
    | 'badge'
    | 'progress'
    | 'currency'
    | 'date'
    | 'maintableactions'
    | 'actions';
  mainTableActions?: MainTableActionType[]; // New property for main table actions
  actions?: ActionType[]; // Keep existing actions
}

interface TableConfig {
  title: string;
  subtitle: string;
  columns: TableColumn[];
}

interface ChartDataPoint {
  [key: string]: string | number;
}

interface PieChartDataPoint {
  name: string;
  value: number;
  color: string;
}

interface ChartConfig {
  id: string;
  title: string;
  type: 'pie' | 'bar' | 'line';
  dataProcessor: (
    data: ProjectData[]
  ) => ChartDataPoint[] | PieChartDataPoint[];
}

interface DashboardConfig {
  header: HeaderConfig;
  stats: StatConfig[];
  filters: FilterConfig[];
  table: TableConfig;
  charts?: ChartConfig[];
}

interface Filters {
  search?: string;
  status?: string;
  category?: string[];
  assignee?: string;
  minAmount?: string;
  maxAmount?: string;
  notes?: string;
}

interface StatResult extends StatConfig {
  value: string | number;
}

interface DynamicComponentProps {
  config: FilterConfig;
  value: any;
  onChange?: (value: any) => void;
}

// Pagination Component
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
}) => {
  const startItem: number = (currentPage - 1) * pageSize + 1;
  const endItem: number = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const iconMap: { [key: string]: IconSvgObject } = {
  FilterIcon: FilterIcon,
  Add01Icon: Add01Icon,
  QuestionIcon: QuestionIcon,
};

const getIconObject = (iconName: any): IconSvgObject => {
  return iconMap[iconName] || QuestionIcon;
};
const DynamicComponent: React.FC<DynamicComponentProps> = ({
  config,
  value,
  onChange,
}) => {
  const { component, props = {} } = config;

  switch (component) {
    case 'Input':
      return (
        <Input
          value={value || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange?.(e.target.value)
          }
          {...props}
        />
      );

    case 'IconInput':
      return (
        <IconInput
          //@ts-ignore
          icon={getIconObject(props.icon)}
          {...props}
          inputProps={{
            ...props.inputProps,
            value: value || '',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              onChange?.(e.target.value),
          }}
        />
      );

    case 'Combobox':
      return (
        <Combobox
          options={props.options || []}
          placeholder={props.placeholder}
          defaultValue={value || ''}
          onChange={onChange}
        />
      );

    case 'MultiSelect':
      return (
        <MultiSelect
          options={props.options || []}
          placeholder={props.placeholder}
          defaultValues={value || []}
          onChange={onChange}
        />
      );

    case 'Textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onChange?.(e.target.value)
          }
          {...props}
        />
      );

    case 'FileUploader':
      return <FileUploader onFilesChange={onChange} {...props} />;

    case 'IconCombobox':
      return (
        <IconCombobox
          options={props.options || []}
          placeholder={props.placeholder}
          defaultValue={value || ''}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
};

const getAllApi = async (slug: string) => {
  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_API_HOST}/api/v1/${slug}`,
    {
      withCredentials: true,
    }
  );
  return data;
};

interface JsonDrivenDashboardProps {
  id?: string;
}

// Main Component
const JsonDrivenDashboard: React.FC<JsonDrivenDashboardProps> = ({ id }) => {
  const router = useRouter();
  const { slug } = useParams();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [pageSize] = useState<number>(5);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] =
    useState<boolean>(false);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<Filters>({});
  const [backenddata, setBackendata] = useState<any>(null);
  const [dashboardConfig, setDashboardConfig] =
    useState<DashboardConfig | null>(null);
  const [data, setData] = useState<any>(null);
  const functionMap = {
    COUNT_ALL: (data: ProjectData[]) => data.length,
    COUNT_IN_PROGRESS: (data: ProjectData[]) =>
      data.filter((d) => d.status === 'In Progress').length,
    // etc.
  };
  console.log(slug);
  const {
    data: backendFetchedData,
    isLoading,
    isError,
  } = useQuery({
    queryFn: () => getAllApi(slug as string),
    queryKey: [`${slug}-view-all`],
  });

  React.useEffect(() => {
    if (!backendFetchedData) return;
    setBackendata(backendFetchedData);
    setDashboardConfig(backendFetchedData.displayModel.dashboardConfig);
    setData(backendFetchedData.mainData);
  }, [backendFetchedData]);
  // JSON Configuration
  // const dashboardConfig: DashboardConfig = {
  //   header: {
  //     title: 'Project Dashboard',
  //     subtitle: 'Manage and track your project portfolio',
  //     buttons: [
  //       {
  //         type: 'filter',
  //         label: 'Filters',
  //         icon: FilterIcon,
  //         action: 'toggleFilter',
  //       },
  //       {
  //         type: 'primary',
  //         label: 'Add Project',
  //         icon: Add01Icon,
  //         action: 'addProject',
  //       },
  //     ],
  //   },
  //   stats: [
  //     {
  //       id: 'total',
  //       label: 'Total Projects',
  //       icon: User03Icon,
  //       color: 'blue',
  //     },
  //     {
  //       id: 'inProgress',
  //       label: 'In Progress',
  //       icon: Calendar01Icon,
  //       color: 'orange',
  //     },
  //     {
  //       id: 'completed',
  //       label: 'Completed',
  //       icon: Tag01Icon,
  //       color: 'green',
  //     },
  //     {
  //       id: 'totalValue',
  //       label: 'Total Value',
  //       icon: Dollar01Icon,
  //       color: 'purple',
  //     },
  //   ],
  //   filters: [
  //     {
  //       id: 'search',
  //       type: 'iconInput',
  //       label: 'Search',
  //       component: 'IconInput',
  //       props: {
  //         icon: Search01Icon,
  //         inputProps: { placeholder: 'Search projects...' },
  //       },
  //     },
  //     {
  //       id: 'status',
  //       type: 'select',
  //       label: 'Status',
  //       component: 'Combobox',
  //       props: {
  //         placeholder: 'All Statuses',
  //         options: [
  //           { value: 'all', label: 'All Statuses' },
  //           { value: 'in-progress', label: 'In Progress' },
  //           { value: 'completed', label: 'Completed' },
  //           { value: 'pending', label: 'Pending' },
  //           { value: 'on-hold', label: 'On Hold' },
  //         ],
  //       },
  //     },
  //     {
  //       id: 'category',
  //       type: 'multiselect',
  //       label: 'Categories',
  //       component: 'MultiSelect',
  //       props: {
  //         placeholder: 'Select categories',
  //         options: [
  //           { value: 'development', label: 'Development' },
  //           { value: 'design', label: 'Design' },
  //           { value: 'research', label: 'Research' },
  //           { value: 'marketing', label: 'Marketing' },
  //           { value: 'security', label: 'Security' },
  //           { value: 'infrastructure', label: 'Infrastructure' },
  //         ],
  //       },
  //     },
  //     {
  //       id: 'assignee',
  //       type: 'iconCombobox',
  //       label: 'Assignee',
  //       component: 'IconCombobox',
  //       props: {
  //         placeholder: 'Select assignee',
  //         leftIcon: <HugeiconsIcon icon={User03Icon} />,
  //         options: [
  //           {
  //             value: 'sarah',
  //             label: 'Sarah Chen',
  //             icon: <HugeiconsIcon icon={User03Icon} />,
  //           },
  //           {
  //             value: 'marcus',
  //             label: 'Marcus Johnson',
  //             icon: <HugeiconsIcon icon={User03Icon} />,
  //           },
  //           {
  //             value: 'elena',
  //             label: 'Elena Rodriguez',
  //             icon: <HugeiconsIcon icon={User03Icon} />,
  //           },
  //           {
  //             value: 'david',
  //             label: 'David Kim',
  //             icon: <HugeiconsIcon icon={User03Icon} />,
  //           },
  //         ],
  //       },
  //     },
  //     {
  //       id: 'minAmount',
  //       type: 'input',
  //       label: 'Min Amount',
  //       component: 'Input',
  //       props: {
  //         type: 'number',
  //         placeholder: 'Min amount',
  //       },
  //     },
  //     {
  //       id: 'maxAmount',
  //       type: 'input',
  //       label: 'Max Amount',
  //       component: 'Input',
  //       props: {
  //         type: 'number',
  //         placeholder: 'Max amount',
  //       },
  //     },
  //     {
  //       id: 'notes',
  //       type: 'textarea',
  //       label: 'Project Notes',
  //       component: 'Textarea',
  //       props: {
  //         placeholder: 'Add project notes or requirements...',
  //       },
  //     },
  //   ],
  //   table: {
  //     title: 'Projects',
  //     subtitle:
  //       'A list of all projects in your account including their name, status, and details.',
  //     columns: [
  //       {
  //         key: 'actions',
  //         label: '',
  //         type: 'actions',
  //         actions: [
  //           {
  //             type: 'button',
  //             label: 'Edit',
  //             variant: 'primary',
  //             onClick: () => {},
  //           },
  //           {
  //             type: 'button',
  //             label: 'Delete',
  //             variant: 'danger',
  //             onClick: () => {},
  //           },
  //           // {
  //           //   type: 'checkbox',
  //           //   label: 'Enable',
  //           //   variant: 'primary',
  //           //   checked: true,
  //           //   onChange: () => {},
  //           // },
  //         ],
  //       },
  //       { key: 'name', label: 'Project', type: 'text' },
  //       { key: 'status', label: 'Status', type: 'badge' },
  //       { key: 'category', label: 'Category', type: 'text' },
  //       { key: 'assignee', label: 'Assignee', type: 'text' },
  //       { key: 'progress', label: 'Progress', type: 'progress' },
  //       { key: 'amount', label: 'Amount', type: 'currency' },
  //       { key: 'date', label: 'Date', type: 'date' },
  //     ],
  //   },
  //   // charts: [
  //   //   {
  //   //     id: 'statusDistribution',
  //   //     title: 'Status Distribution',
  //   //     type: 'pie',
  //   //     dataProcessor: (data: ProjectData[]): PieChartDataPoint[] => {
  //   //       const statusCounts = data.reduce(
  //   //         (acc: Record<string, number>, item) => {
  //   //           acc[item.status] = (acc[item.status] || 0) + 1;
  //   //           return acc;
  //   //         },
  //   //         {}
  //   //       );
  //   //       return Object.entries(statusCounts).map(([status, count]) => ({
  //   //         name: status,
  //   //         value: count,
  //   //         color: getStatusColor(status),
  //   //       }));
  //   //     },
  //   //   },
  //   //   {
  //   //     id: 'categoryAmounts',
  //   //     title: 'Budget by Category',
  //   //     type: 'bar',
  //   //     dataProcessor: (data: ProjectData[]): ChartDataPoint[] => {
  //   //       return data.reduce((acc: ChartDataPoint[], item) => {
  //   //         const existing = acc.find((cat) => cat.category === item.category);
  //   //         if (existing) {
  //   //           existing.amount = (existing.amount as number) + item.amount;
  //   //           existing.count = (existing.count as number) + 1;
  //   //         } else {
  //   //           acc.push({
  //   //             category: item.category,
  //   //             amount: item.amount,
  //   //             count: 1,
  //   //           });
  //   //         }
  //   //         return acc;
  //   //       }, []);
  //   //     },
  //   //   },
  //   //   {
  //   //     id: 'progressDistribution',
  //   //     title: 'Progress Distribution',
  //   //     type: 'bar',
  //   //     dataProcessor: (data: ProjectData[]): ChartDataPoint[] => {
  //   //       const progressRanges: Record<string, number> = {
  //   //         '0-25%': 0,
  //   //         '26-50%': 0,
  //   //         '51-75%': 0,
  //   //         '76-100%': 0,
  //   //       };
  //   //       data.forEach((item) => {
  //   //         if (item.progress <= 25) progressRanges['0-25%']++;
  //   //         else if (item.progress <= 50) progressRanges['26-50%']++;
  //   //         else if (item.progress <= 75) progressRanges['51-75%']++;
  //   //         else progressRanges['76-100%']++;
  //   //       });
  //   //       return Object.entries(progressRanges).map(([range, count]) => ({
  //   //         range,
  //   //         count,
  //   //       }));
  //   //     },
  //   //   },
  //   //   {
  //   //     id: 'timeline',
  //   //     title: 'Project Timeline',
  //   //     type: 'line',
  //   //     dataProcessor: (data: ProjectData[]): ChartDataPoint[] => {
  //   //       return data
  //   //         .reduce((acc: ChartDataPoint[], item) => {
  //   //           const month = new Date(item.date).toLocaleDateString('en-US', {
  //   //             year: 'numeric',
  //   //             month: 'short',
  //   //           });
  //   //           const existing = acc.find((m) => m.month === month);
  //   //           if (existing) {
  //   //             existing.projects = (existing.projects as number) + 1;
  //   //             existing.amount = (existing.amount as number) + item.amount;
  //   //           } else {
  //   //             acc.push({ month, projects: 1, amount: item.amount });
  //   //           }
  //   //           return acc;
  //   //         }, [])
  //   //         .sort(
  //   //           (a, b) =>
  //   //             new Date(a.month as string).getTime() -
  //   //             new Date(b.month as string).getTime()
  //   //         );
  //   //     },
  //   //   },
  //   // ],
  // };

  // Sample data
  // const [data] = useState<ProjectData[]>([
  //   {
  //     id: '1',
  //     name: 'E-commerce Platform',
  //     status: 'In Progress',
  //     category: 'Development',
  //     amount: 15000,
  //     date: '2024-12-15',
  //     assignee: 'Sarah Chen',
  //     progress: 75,
  //   },
  //   {
  //     id: '2',
  //     name: 'Brand Identity System',
  //     status: 'Completed',
  //     category: 'Design',
  //     amount: 8500,
  //     date: '2024-11-20',
  //     assignee: 'Marcus Johnson',
  //     progress: 100,
  //   },
  //   {
  //     id: '3',
  //     name: 'Cloud Migration',
  //     status: 'Pending',
  //     category: 'Infrastructure',
  //     amount: 22000,
  //     date: '2024-12-01',
  //     assignee: 'Elena Rodriguez',
  //     progress: 0,
  //   },
  //   {
  //     id: '4',
  //     name: 'User Experience Research',
  //     status: 'In Progress',
  //     category: 'Research',
  //     amount: 5500,
  //     date: '2024-12-10',
  //     assignee: 'David Kim',
  //     progress: 45,
  //   },
  //   {
  //     id: '5',
  //     name: 'Security Implementation',
  //     status: 'On Hold',
  //     category: 'Security',
  //     amount: 18000,
  //     date: '2024-11-30',
  //     assignee: 'Lisa Wang',
  //     progress: 30,
  //   },
  //   {
  //     id: '6',
  //     name: 'Mobile Application',
  //     status: 'In Progress',
  //     category: 'Development',
  //     amount: 35000,
  //     date: '2024-12-05',
  //     assignee: 'Alex Thompson',
  //     progress: 60,
  //   },
  //   {
  //     id: '7',
  //     name: 'Content Management',
  //     status: 'Completed',
  //     category: 'Marketing',
  //     amount: 7200,
  //     date: '2024-11-15',
  //     assignee: 'Maya Patel',
  //     progress: 100,
  //   },
  //   {
  //     id: '8',
  //     name: 'API Development',
  //     status: 'Pending',
  //     category: 'Development',
  //     amount: 12000,
  //     date: '2024-12-08',
  //     assignee: 'Jordan Lee',
  //     progress: 0,
  //   },
  // ]);

  const getStatusStyle = (status: string): string => {
    switch (status.toLowerCase().replace(' ', '-')) {
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'on-hold':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase().replace(' ', '-')) {
      case 'in-progress':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'on-hold':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getColorByName = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600',
      orange: 'bg-orange-50 text-orange-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      red: 'bg-red-50 text-red-600',
      gray: 'bg-gray-50 text-gray-600',
    };
    return colorMap[colorName] || colorMap.gray;
  };

  // Filter data based on JSON filters
  const filteredData = useMemo((): any[] => {
    return (
      data &&
      data.filter((item: any) => {
        const searchTerm: string = filters.search?.toLowerCase() || '';
        const matchesSearch: boolean =
          !searchTerm ||
          item.name.toLowerCase().includes(searchTerm) ||
          item.assignee.toLowerCase().includes(searchTerm);

        const matchesStatus: boolean =
          !filters.status ||
          filters.status === 'all' ||
          item.status.toLowerCase().replace(' ', '-') === filters.status;

        const matchesCategories: boolean =
          !filters.category ||
          filters.category.length === 0 ||
          filters.category.includes(item.category.toLowerCase());

        const matchesMinAmount: boolean =
          !filters.minAmount || item.amount >= parseInt(filters.minAmount);

        const matchesMaxAmount: boolean =
          !filters.maxAmount || item.amount <= parseInt(filters.maxAmount);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategories &&
          matchesMinAmount &&
          matchesMaxAmount
        );
      })
    );
  }, [data, filters]);

  // Paginated data
  const paginatedData = useMemo((): any[] => {
    const startIndex: number = (currentPage - 1) * pageSize;
    return (
      data &&
      filteredData &&
      filteredData.slice(startIndex, startIndex + pageSize)
    );
  }, [filteredData, currentPage, pageSize]);

  React.useEffect(() => {
    if (!filteredData || filteredData === null) return;
    setTotalPages(Math.ceil(filteredData.length / pageSize));
  }, [filteredData]);

  // Chart data processing
  const chartData = useMemo((): Record<
    string,
    ChartDataPoint[] | PieChartDataPoint[]
  > => {
    if (
      !dashboardConfig ||
      dashboardConfig === undefined ||
      (dashboardConfig && !dashboardConfig.charts) ||
      dashboardConfig.charts === undefined
    ) {
      return {};
    }

    return dashboardConfig.charts.reduce((acc, chart) => {
      acc[chart.id] = chart.dataProcessor(filteredData);
      return acc;
    }, {} as Record<string, ChartDataPoint[] | PieChartDataPoint[]>);
  }, [filteredData, dashboardConfig && dashboardConfig.charts]);

  // Stats calculation
  const stats = useMemo((): Record<string, StatResult> => {
    return (
      backenddata &&
      dashboardConfig &&
      dashboardConfig.stats.reduce((acc, stat) => {
        acc[stat.id] = {
          ...stat,
          value: backenddata.stats[stat.id], // Just use raw backend value
        };
        return acc;
      }, {} as Record<string, StatResult>)
    );
  }, [backenddata, dashboardConfig && dashboardConfig.stats]);

  const handleFilterChange = (filterId: string, value: any): void => {
    setFilters((prev) => ({ ...prev, [filterId]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = (): void => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleButtonAction = (action: string): void => {
    switch (action) {
      case 'toggleFilter':
        setIsFilterOpen(!isFilterOpen);
        break;
      case 'addNew':
        router.push(`/admin/dashboard/${slug}/add-new`);
        break;
      default:
        break;
    }
  };

  const renderChart = (chart: ChartConfig): ReactNode => {
    const data = chartData[chart.id];

    switch (chart.type) {
      case 'pie':
        const pieData = data as PieChartDataPoint[];
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
        const barData = data as ChartDataPoint[];
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(barData[0] || {})[0]} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'amount')
                    return [`$${value.toLocaleString()}`, 'Amount'];
                  return [value, name];
                }}
              />
              <Bar
                dataKey={Object.keys(barData[0] || {})[1]}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        const lineData = data as ChartDataPoint[];
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="projects"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  const renderTableCell = (
    column: TableColumn,
    item: ProjectData
  ): ReactNode => {
    // Get the value - handle nested properties if key contains dot
    const getValue = (key: string) => {
      if (key.includes('.')) {
        return getNestedValue(item, key);
      }
      return item[key as keyof ProjectData];
    };

    const getVariantColor = (variant: ButtonVariant): string => {
      const variantColors: Record<ButtonVariant, string> = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
        success: 'bg-green-600 hover:bg-green-700 text-white',
        warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
      };
      return variantColors[variant];
    };

    const processLink = (link: string, item: ProjectData): string => {
      let processedLink = link;

      if (item.id !== undefined) {
        processedLink = processedLink.replace('{id}', item.id.toString());
      }

      if (slug !== undefined) {
        processedLink = processedLink.replace('{slug}', slug.toString());
      }

      return processedLink;
    };

    switch (column.type) {
      case 'text':
        const textValue = getValue(column.key);
        return <div className="text-sm font-medium">{textValue ?? '-'}</div>;

      case 'badge':
        const statusValue = getValue(column.key) as string;
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusStyle(
              statusValue
            )}`}
          >
            {statusValue ?? '-'}
          </span>
        );

      case 'progress':
        const progressValue = getValue(column.key) as number;
        return (
          <div className="flex items-center">
            <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
              <div
                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progressValue || 0}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 min-w-[40px]">
              {progressValue || 0}%
            </span>
          </div>
        );

      case 'currency':
        const amountValue = getValue(column.key) as number;
        return (
          <div className="text-sm font-medium">
            ${(amountValue || 0).toLocaleString()}
          </div>
        );

      case 'date':
        const dateValue = getValue(column.key);
        return <div className="text-sm">{dateValue ?? '-'}</div>;

      case 'maintableactions':
        const mainActions = column.mainTableActions || [];

        return (
          <div className="flex items-center gap-2">
            {mainActions.map((action, index) => {
              const handleClick = () => {
                const processedLink = processLink(action.link, item);

                if (processedLink.startsWith('http')) {
                  window.open(processedLink, '_blank');
                } else {
                  window.location.href = processedLink;
                }
              };

              return (
                <button
                  key={index}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    action.color || getVariantColor(action.variant)
                  }`}
                  onClick={handleClick}
                  title={action.tooltip}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        );
      case 'actions':
        return (
          <button
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            onClick={() =>
              setExpandedRowId(expandedRowId === item.id ? null : item.id)
            }
          >
            {expandedRowId === item.id ? (
              <HugeiconsIcon icon={CancelCircleIcon} />
            ) : (
              <HugeiconsIcon icon={Edit02Icon} />
            )}
          </button>
        );

      default:
        return <div>-</div>;
    }
  };

  const renderActions = (actions: any[], item: any) => {
    return (
      <div className="flex flex-row gap-4">
        {actions.map((action, index) => {
          switch (action.type) {
            case 'button':
              return (
                <Button
                  key={index}
                  className={`px-3 py-1`}
                  variant={action.variant}
                  onClick={() => action.onClick?.()}
                >
                  {action.label}
                </Button>
              );
            case 'checkbox':
              return (
                <label key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={action.checked}
                    onChange={(e) => action.onChange?.(e.target.checked)}
                  />
                  {action.label}
                </label>
              );
            case 'switch':
              return (
                <label key={index} className="flex items-center gap-2">
                  <span>{action.label}</span>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={action.checked}
                    onChange={(e) => action.onChange?.(e.target.checked)}
                  />
                </label>
              );
            case 'edit':
              return (
                <Link href={`/admin/dashboard/${slug}/edit/${item.id}`}>
                  <Button
                    key={index}
                    className={`px-3 py-1`}
                    variant={action.variant}
                    onClick={() => action.onClick?.()}
                  >
                    {action.label}
                  </Button>
                </Link>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };

  if (!backenddata || !dashboardConfig || !data) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={`min-h-screen bg-background relative ${
        isFilterOpen ? 'max-h-screen ' : ''
      }`}
    >
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-20 pr-5">
        <div className="mx-auto px-6 py-[1.2rem]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {dashboardConfig.header.title}
              </h1>
              <p className="text-gray-500 mt-1">
                {dashboardConfig.header.subtitle}
              </p>
            </div>
            <div className="flex gap-3">
              {dashboardConfig.header.buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => handleButtonAction(button.action)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    button.type === 'filter' && isFilterOpen
                      ? 'bg-gray-900 text-white'
                      : button.type === 'primary'
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <HugeiconsIcon icon={getIconObject(button.icon)} />

                  {button.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`mx-auto px-6 py-4 overflow-hidden ${
          isFilterOpen ? '' : 'relative'
        }`}
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {dashboardConfig.stats.map((stat) => (
            <div
              key={stat.id}
              className="p-3 rounded-xl border border-border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{stat.label}</p>
                  {/* <p className="text-2xl font-bold mt-1">
                    {stats[stat.id]?.value}
                  </p> */}
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold ${getColorByName(
                    stat.color
                  )}`}
                >
                  {/* <HugeiconsIcon icon={getIconObject(stat.icon)} /> */}
                  {stats[stat.id]?.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Toggle */}
        {dashboardConfig.charts && (
          <div className="mb-8 z-30 relative">
            <button
              onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
              className="flex items-center gap-3 w-full p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <HugeiconsIcon
                    icon={ChartLineData01Icon}
                    className="text-blue-600"
                  />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Project Analytics</h3>
                  <p className="text-sm">View detailed charts and insights</p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className={`text-gray-400 transform transition-transform duration-200 ${
                  isAnalyticsExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        )}

        {/* Analytics Section */}
        {dashboardConfig.charts && (
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isAnalyticsExpanded
                ? 'max-h-[2000px] opacity-100 mb-8 z-30 relative'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="rounded-xl border border-border shadow-sm p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {dashboardConfig.charts &&
                  dashboardConfig.charts.map((chart) => (
                    <div key={chart.id} className="space-y-4">
                      <h4 className="text-lg font-semibold">{chart.title}</h4>
                      <div className="rounded-lg p-4">{renderChart(chart)}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className="rounded-xl border border-border shadow-sm overflow-hidden z-30 relative">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">
              {dashboardConfig.table.title}
            </h2>
            <p className="text-sm mt-1">{dashboardConfig.table.subtitle}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  {dashboardConfig.table.columns.map((column) => (
                    <th
                      key={column.key}
                      className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedData.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`transition-colors ${
                        expandedRowId !== item.id
                          ? 'border-b border-border'
                          : ''
                      }`}
                    >
                      {dashboardConfig.table.columns.map((column) => (
                        <td key={column.key} className="py-4 px-6">
                          {renderTableCell(column, item)}
                        </td>
                      ))}
                    </tr>

                    {expandedRowId === item.id && (
                      <tr>
                        <td
                          colSpan={dashboardConfig.table.columns.length}
                          className="px-6 py-4"
                        >
                          {renderActions(
                            dashboardConfig.table.columns.find(
                              (col) => col.key === 'actions'
                            )?.actions ?? [],
                            item
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            totalItems={filteredData.length}
          />
        </div>

        {/* Filter Sidebar - Completion */}
        <div
          className={`absolute right-0 top-0 w-[99vw] ${
            isFilterOpen ? 'z-40 opacity-100' : 'opacity-0 w-0 z-0'
          } h-screen backdrop-blur-sm flex transition-all duration-300 ease-in-out justify-end`}
          onClick={() => setIsFilterOpen(false)}
        >
          <div
            className={`w-96 h-full bg-background shadow-2xl border-l border-border transform transition-transform duration-300 ease-in-out ${
              isFilterOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Filter Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-lg font-semibold">Filters</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 px-3 py-1 rounded-md hover:bg-surface-200 hover:text-white transition-colors"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
                  >
                    <HugeiconsIcon
                      icon={CancelCircleIcon}
                      className="w-5 h-5"
                    />
                  </button>
                </div>
              </div>

              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {dashboardConfig.filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {filter.label}
                    </label>
                    <DynamicComponent
                      config={filter}
                      value={filters[filter.id as keyof Filters]}
                      onChange={(value) => handleFilterChange(filter.id, value)}
                    />
                  </div>
                ))}
              </div>

              {/* Filter Footer */}
              <div className="p-6 border-t border-border">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Apply filters and close
                      setIsFilterOpen(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonDrivenDashboard;
