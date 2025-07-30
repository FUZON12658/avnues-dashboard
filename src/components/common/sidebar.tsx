"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, memo } from "react";
import { FaAngleRight, FaChevronLeft } from "react-icons/fa6";

import { getSidebarApi } from "@/api/auth/misc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getIconObject } from "./modern-table-page";

// Define the type for your navigation structure
interface NavigationItem {
  label: string;
  icon: any;
  link?: string;
  endpoint: string;
  type: 'link' | 'submenu';
  id: string;
  submenu?: {
    label: string;
    link: string;
    id: string;
    endpoint: string;
  }[];
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

interface ActiveState {
  activeItem: string;
  activeSubItem: string;
  menusToOpen: Record<string, boolean>;
}

// Memoized menu item component to prevent unnecessary re-renders
const MenuItem = memo(({ 
  item, 
  isOpen, 
  isActive, 
  isCollapsed, 
  activeSubItem, 
  onToggleMenu 
}: {
  item: NavigationItem;
  isOpen: boolean;
  isActive: boolean;
  isCollapsed: boolean;
  activeSubItem: string;
  onToggleMenu: (id: string) => void;
}) => {
  const commonClasses =
    "flex items-center w-full px-4 py-4 transition-colors duration-200 rounded-lg cursor-pointer";
  
  const activeClasses = isActive
    ? isCollapsed
      ? "pr-[2.55rem] bg-primary/30 text-primary border-r-2 border-primary"
      : "bg-primary/20 text-primary border-l-4 border-primary"
    : isCollapsed
    ? "pr-[2.55rem] hover:bg-surface-100 text-surface-600"
    : "hover:bg-surface-100 text-surface-600";

  const handleToggle = useCallback(() => {
    onToggleMenu(item.id);
  }, [item.id, onToggleMenu]);

  if (item.type === "link") {
    return (
      <li>
        <Link
          href={item.link || "#"}
          className={`${commonClasses} ${activeClasses}`}
        >
          <span className="mr-3 -mt-1">
            <HugeiconsIcon 
              icon={getIconObject(item.icon)} 
              className={isActive ? "text-primary" : ""}
            />
          </span>
          <span
            className={`transition-all ease-in-out font-medium ${
              isActive ? "text-primary" : ""
            } ${
              isCollapsed
                ? "opacity-0 pointer-events-none duration-0"
                : "opacity-100 delay-150 duration-300 pointer-events-auto"
            }`}
          >
            {item.label}
          </span>
        </Link>
      </li>
    );
  }

  if (item.type === "submenu") {
    return (
      <li>
        <button
          onClick={handleToggle}
          className={`${commonClasses} ${activeClasses}`}
        >
          <span className="mr-3">
            <HugeiconsIcon 
              icon={getIconObject(item.icon)} 
              className={isActive ? "text-primary" : ""}
            />
          </span>

          <span
            className={`flex-1 text-left transition-all ease-in-out font-medium ${
              isActive ? "text-primary" : ""
            } ${
              isCollapsed
                ? "opacity-0 pointer-events-none duration-0"
                : "opacity-100 delay-150 duration-300 pointer-events-auto"
            }`}
          >
            {item.label}
          </span>
          <FaAngleRight
            className={`transform transition-transform ${
              isActive ? "text-primary" : ""
            } ${
              isOpen
                ? "rotate-90 duration-200"
                : isCollapsed
                ? "opacity-0 pointer-events-none duration-0"
                : "opacity-100 delay-150 duration-300 pointer-events-auto"
            }`}
          />
        </button>

        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out ${
            isOpen && !isCollapsed ? "max-h-60" : "max-h-0"
          }`}
        >
          <ul className="relative pl-8 py-1">
            <div className={`absolute left-8 top-0 bottom-0 w-px transition-colors duration-200 ${
              isActive ? "bg-primary" : "bg-border"
            }`}></div>

            {item.submenu?.map((subItem) => {
              const isSubItemActive = activeSubItem === subItem.id;
              
              return (
                <li key={subItem.id} className="relative">
                  <div className={`absolute left-0 top-1/2 w-4 h-px transition-colors duration-200 ${
                    isActive ? "bg-primary" : "bg-border"
                  }`}></div>

                  <Link
                    href={subItem.link}
                    className={`block py-4 transition-all ease-in-out pl-8 rounded-md ${
                      isSubItemActive
                        ? "text-primary font-medium ml-2"
                        : "hover:text-surface-900 text-surface-800 hover:bg-surface-50"
                    } ${
                      isCollapsed
                        ? "opacity-0 pointer-events-none duration-0"
                        : "opacity-100 delay-150 duration-300 pointer-events-auto"
                    }`}
                  >
                    {subItem.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </li>
    );
  }

  return null;
});

MenuItem.displayName = 'MenuItem';

// Memoized section component
const NavigationSectionComponent = memo(({ 
  section, 
  openMenus, 
  activeState, 
  isCollapsed, 
  onToggleMenu 
}: {
  section: NavigationSection;
  openMenus: Record<string, boolean>;
  activeState: ActiveState;
  isCollapsed: boolean;
  onToggleMenu: (id: string) => void;
}) => {
  return (
    <div className="mb-2">
      <h5
        className={`text-sm uppercase font-semibold text-gray-500 px-4 mt-4 mb-2 transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "opacity-0 absolute pointer-events-none"
            : "opacity-100 delay-150 pointer-events-auto"
        }`}
      >
        {section.title}
      </h5>

      <ul className="space-y-1">
        {section.items.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            isOpen={openMenus[item.id] || false}
            isActive={activeState.activeItem === item.id}
            isCollapsed={isCollapsed}
            activeSubItem={activeState.activeSubItem}
            onToggleMenu={onToggleMenu}
          />
        ))}
      </ul>
    </div>
  );
});

NavigationSectionComponent.displayName = 'NavigationSectionComponent';

const Sidebar = () => {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tempOpenMenus, setTempOpenMenus] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [navigationSections, setNavigationSections] = useState<NavigationSection[]>([]);

  const { data } = useQuery({
    queryFn: getSidebarApi,
    queryKey: ['sidebar']
  });

  // Stable path checking function
  const isPathActive = useCallback((itemPath: string, currentPath: string): boolean => {
    if (itemPath === "/" && currentPath === "/") return true;
    if (!itemPath || itemPath === "/") return false;

    const escaped = itemPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|/)${escaped}(?=/|$)`);
    return regex.test(currentPath);
  }, []);

  // Memoized active state calculation
  const activeState = useMemo((): ActiveState => {
    if (navigationSections.length === 0) {
      return { 
        activeItem: "", 
        activeSubItem: "", 
        menusToOpen: {} 
      };
    }

    let activeItem = "";
    let activeSubItem = "";
    const menusToOpen: Record<string, boolean> = {};

    for (const section of navigationSections) {
      for (const item of section.items) {
        if (item.type === "link" && item.link && isPathActive(item.link, pathname)) {
          activeItem = item.id;
          break;
        } else if (item.type === "submenu" && item.submenu) {
          const activeSubMenuItem = item.submenu.find(subItem => 
            isPathActive(subItem.link, pathname)
          );
          if (activeSubMenuItem) {
            activeItem = item.id;
            activeSubItem = activeSubMenuItem.id;
            menusToOpen[item.id] = true;
            break;
          }
        }
      }
      if (activeItem) break;
    }

    return { activeItem, activeSubItem, menusToOpen };
  }, [navigationSections, pathname, isPathActive]);

  // Stable storage functions
  const saveToStorage = useCallback((key: string, value: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to sessionStorage:`, error);
    }
  }, []);

  // Load initial state
  useEffect(() => {
    try {
      const savedCollapsed = sessionStorage.getItem('sidebar-collapsed');
      const savedTempOpenMenus = sessionStorage.getItem('sidebar-temp-open-menus');
      
      if (savedCollapsed) {
        setIsCollapsed(JSON.parse(savedCollapsed));
      }
      
      if (savedTempOpenMenus) {
        setTempOpenMenus(JSON.parse(savedTempOpenMenus));
      }
    } catch (error) {
      console.error('Error loading sidebar state from sessionStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Set navigation data
  useEffect(() => {
    if (data?.mainData?.sections) {
      setNavigationSections(data.mainData.sections);
    }
  }, [data]);

  // Update open menus based on active state
  useEffect(() => {
    if (!isInitialized || navigationSections.length === 0) return;

    if (isCollapsed) {
      // Save which menus should be open when expanded
      setTempOpenMenus(prev => ({
        ...prev,
        ...activeState.menusToOpen
      }));
      saveToStorage('sidebar-temp-open-menus', {
        ...tempOpenMenus,
        ...activeState.menusToOpen
      });
    } else {
      // Merge previously saved open menus with currently active menus
      const newOpenMenus = {
        ...tempOpenMenus,
        ...activeState.menusToOpen
      };
      
      // Only update if there's actually a change
      setOpenMenus(prev => {
        const hasChanged = Object.keys(newOpenMenus).some(
          key => prev[key] !== newOpenMenus[key]
        ) || Object.keys(prev).some(
          key => prev[key] !== newOpenMenus[key]
        );
        
        return hasChanged ? newOpenMenus : prev;
      });
    }
  }, [activeState, isCollapsed, isInitialized, navigationSections.length, tempOpenMenus, saveToStorage]);

  // Stable toggle functions
  const toggleMenu = useCallback((menuId: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      saveToStorage('sidebar-collapsed', false);
    }
    
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  }, [isCollapsed, saveToStorage]);

  const toggleCollapsible = useCallback(() => {
    const newCollapsedState = !isCollapsed;
    
    if (!isCollapsed) {
      // Collapsing: save current open menus
      setTempOpenMenus(openMenus);
      setOpenMenus({});
      saveToStorage('sidebar-temp-open-menus', openMenus);
    } else {
      // Expanding: restore menus
      setOpenMenus(tempOpenMenus);
      setTempOpenMenus({});
      saveToStorage('sidebar-temp-open-menus', {});
    }
    
    setIsCollapsed(newCollapsedState);
    saveToStorage('sidebar-collapsed', newCollapsedState);
  }, [isCollapsed, openMenus, tempOpenMenus, saveToStorage]);

  // Show loading state
  if (navigationSections.length === 0) {
    return (
      <div className="max-w-72 w-72 min-w-72 bg-background border-r border-border h-screen flex items-center justify-center">
        <div className="text-surface-600">Loading...</div>
      </div>
    );
  }

  return (
    <nav
      className={`max-w-72 ${
        isCollapsed ? "w-24 min-w-24" : "w-72 min-w-72"
      } sticky top-0 left-0 bg-background border-r border-border h-screen flex flex-col shadow-lg transition-all duration-300 ease-in-out z-50`}
    >
      <div
        className="absolute cursor-pointer -right-5 top-[4.95rem] p-2 border-border border-2 rounded-full bg-surface-100 hover:bg-surface-200 transition-colors z-10"
        onClick={toggleCollapsible}
      >
        <FaChevronLeft
          className={`text-lg text-foreground transition-transform duration-300 ease-in-out ${
            isCollapsed ? "rotate-180" : "rotate-0"
          }`}
        />
      </div>
      
      <div className="h-full flex flex-col">
        {/* Logo Section */}
        <div className="py-[1.5625rem] min-h-[6rem] max-h-[6rem] flex">
          <Link
            href="/"
            className={`flex items-start text-primary transition-all mx-auto duration-300 ease-in-out ${
              isCollapsed ? "justify-center translate-x-4" : "justify-center translate-x-0"
            }`}
          >
            <img src="/yangri.svg" alt="logo" className="h-10" />
            
          </Link>
        </div>

        <hr className="m-0 text-border h-[0.125rem]" />
        
        {/* User Section */}
        <div className="py-[1.5625rem] min-h-[6rem] max-h-[6rem] flex">
          <div
            className={`flex items-start text-primary transition-all mx-auto gap-4 duration-300 ease-in-out ${
              isCollapsed ? "justify-center translate-x-4" : "justify-center  translate-x-0"
            }`}
          >
            <img src="/yg.svg" alt="logo" className="h-10" />
            <div
              className={`flex flex-col transition-all duration-300 ease-in-out ${
                isCollapsed
                  ? "opacity-0 pointer-events-none absolute"
                  : "opacity-100 delay-150 pointer-events-auto"
              }`}
            >
              <span className="text-md text-foreground">Avatar</span>
              <span className="text-sm text-gray-600 line-clamp-1">
                Administrator
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div
          className={`overflow-y-auto flex-1 transition-all duration-300 ease-in-out ${
            isCollapsed
              ? "px-[1.375rem] overflow-x-hidden hide-scroll-bar"
              : "px-2 scrollbar-bg"
          }`}
        >
          {navigationSections.map((section) => (
            <NavigationSectionComponent
              key={section.title}
              section={section}
              openMenus={openMenus}
              activeState={activeState}
              isCollapsed={isCollapsed}
              onToggleMenu={toggleMenu}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;