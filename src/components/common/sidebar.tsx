// "use client";
// import { HugeiconsIcon } from "@hugeicons/react";
// import { useState, useEffect } from "react";
// import { FaAngleRight, FaChevronLeft } from "react-icons/fa6";
// import { usePathname } from "next/navigation";

// import {
//   Folder03Icon,
//   Home05Icon,
//   Legal01Icon,
//   News01Icon,
//   Settings01Icon,
//   Tv01Icon,
//   UserGroup03Icon,
// } from "@hugeicons/core-free-icons";
// import Link from "next/link";
// import { useQuery } from "@tanstack/react-query";
// import { getSidebarApi } from "@/api/auth/misc";
// import { getIconObject } from "./modern-table-page";

// // Define the type for your navigation structure
// interface NavigationItem {
//   label: string;
//   icon: any;
//   link?: string;
//   endpoint: string;
//   type: 'link' | 'submenu';
//   id: string;
//   submenu?: {
//     label: string;
//     link: string;
//     id: string;
//     endpoint: string;
//   }[];
// }

// interface NavigationSection {
//   title: string;
//   items: NavigationItem[];
// }

// const Sidebar = () => {
//   const pathname = usePathname();
//   const [openMenus, setOpenMenus] = useState<any>({});
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [activeItem, setActiveItem] = useState("");
//   const [activeSubItem, setActiveSubItem] = useState("");
//   const [tempOpenMenus, setTempOpenMenus] = useState<any>({});
  
//   // Initialize navigationSections as an empty array with proper typing
//   const [navigationSections, setNavigationSections] = useState<NavigationSection[]>([]);

//   const { data, isLoading, isError } = useQuery({
//     queryFn: getSidebarApi,
//     queryKey: ['sidebar']
//   });

//   // Helper function to check if a path is active
//   const isPathActive = (itemPath: string, currentPath: string) => {
//     console.log(itemPath);
//     console.log(currentPath);
//     if (itemPath === "/" && currentPath === "/") return true;
//     if (itemPath !== "/" && currentPath === itemPath) return true;
//     return false;
//   };

//   // Helper function to find active items based on current pathname
//   const findActiveItems = () => {
//     let foundActiveItem = "";
//     let foundActiveSubItem = "";
//     let menusToOpen: any = {};

//     navigationSections.forEach((section) => {
//       section.items.forEach((item) => {
//         if (item.type === "link" && item.link) {
//           if (isPathActive(item.link, pathname)) {
//             foundActiveItem = item.id;
//           }
//         } else if (item.type === "submenu" && item.submenu) {
//           const activeSubItem = item.submenu.find(subItem => 
//             isPathActive(subItem.link, pathname)
//           );
//           if (activeSubItem) {
//             foundActiveItem = item.id;
//             foundActiveSubItem = activeSubItem.id;
//             menusToOpen[item.id] = true;
//           }
//         }
//       });
//     });

//     return { foundActiveItem, foundActiveSubItem, menusToOpen };
//   };

//   // Load state from sessionStorage (using sessionStorage instead of localStorage for Claude.ai compatibility)
//   useEffect(() => {
//     try {
//       const savedCollapsed = sessionStorage.getItem('sidebar-collapsed');
//       const savedTempOpenMenus = sessionStorage.getItem('sidebar-temp-open-menus');
      
//       if (savedCollapsed) {
//         setIsCollapsed(JSON.parse(savedCollapsed));
//       }
      
//       if (savedTempOpenMenus) {
//         setTempOpenMenus(JSON.parse(savedTempOpenMenus));
//       }
//     } catch (error) {
//       console.error('Error loading sidebar state from sessionStorage:', error);
//     }
//   }, []);

//   // Update active items when pathname or navigationSections change
//   useEffect(() => {
//     if (navigationSections.length > 0) {
//       const { foundActiveItem, foundActiveSubItem, menusToOpen } = findActiveItems();
      
//       setActiveItem(foundActiveItem);
//       setActiveSubItem(foundActiveSubItem);
      
//       // Open menus for active items, but preserve manually opened menus
//       setOpenMenus((prev:any) => ({
//         ...prev,
//         ...menusToOpen
//       }));
//     }
//   }, [pathname, navigationSections]);

//   // Save state to sessionStorage
//   const saveToStorage = (key: string, value: any) => {
//     try {
//       sessionStorage.setItem(key, JSON.stringify(value));
//     } catch (error) {
//       console.error(`Error saving ${key} to sessionStorage:`, error);
//     }
//   };

//   // Use useEffect to set the initial data
//   useEffect(() => {
//     data && data.mainData && setNavigationSections(data.mainData.sections);
//   }, [data]);

//   const toggleMenu = (menu: any) => {
//     if (isCollapsed) {
//       setIsCollapsed(false);
//     }
    
//     const newOpenMenus = {
//       ...openMenus,
//       [menu]: !openMenus[menu],
//     };
    
//     setOpenMenus(newOpenMenus);
//   };

//   const toggleCollapsible = () => {
//     const newCollapsedState = !isCollapsed;
    
//     if (!isCollapsed) {
//       // Collapsing: save current open menus and close all
//       setTempOpenMenus(openMenus);
//       setOpenMenus({});
//       saveToStorage('sidebar-temp-open-menus', openMenus);
//     } else {
//       // Expanding: restore previously open menus
//       setOpenMenus(tempOpenMenus);
//       setTempOpenMenus({});
//       saveToStorage('sidebar-temp-open-menus', {});
//     }
    
//     setIsCollapsed(newCollapsedState);
//     saveToStorage('sidebar-collapsed', newCollapsedState);
//   };

//   // Show loading state while navigationSections is empty
//   if (navigationSections.length === 0) {
//     return (
//       <div className="max-w-72 w-72 min-w-72 bg-background border-r border-border h-screen flex items-center justify-center">
//         <div className="text-surface-600">Loading...</div>
//       </div>
//     );
//   }

//   // Render a single menu item (either link or submenu)
//   const renderMenuItem = (item: NavigationItem) => {
//     const isOpen = openMenus[item.id];
//     const isActive = activeItem === item.id;

//     // Common classes for menu items
//     const commonClasses =
//       "flex items-center w-full px-4 py-4 transition-colors duration-200 rounded-lg cursor-pointer";
    
//     const activeClasses = isActive
//       ? isCollapsed
//         ? "pr-[2.55rem] bg-primary/10 text-primary border-r-2 border-primary"
//         : "bg-primary/10 text-primary border-l-4 border-primary"
//       : isCollapsed
//       ? "pr-[2.55rem] hover:bg-surface-100 text-surface-600"
//       : "hover:bg-surface-100 text-surface-600";

//     if (item.type === "link") {
//       return (
//         <li key={item.id}>
//           <Link
//             href={item.link || "#"}
//             className={`${commonClasses} ${activeClasses}`}
//           >
//             <span className="mr-3 -mt-1">
//               <HugeiconsIcon 
//                 icon={getIconObject(item.icon)} 
//                 className={isActive ? "text-primary" : ""}
//               />
//             </span>
//             <span
//               className={`transition-all ease-in-out font-medium ${
//                 isActive ? "text-primary" : ""
//               } ${
//                 isCollapsed
//                   ? "opacity-0 pointer-events-none duration-0"
//                   : "opacity-100 delay-300 duration-700 pointer-events-auto"
//               }`}
//             >
//               {item.label}
//             </span>
//           </Link>
//         </li>
//       );
//     }

//     if (item.type === "submenu") {
//       return (
//         <li key={item.id}>
//           <button
//             onClick={() => toggleMenu(item.id)}
//             className={`${commonClasses} ${activeClasses}`}
//           >
//             <span className="mr-3">
//               <HugeiconsIcon 
//                 icon={getIconObject(item.icon)} 
//                 className={isActive ? "text-primary" : ""}
//               />
//             </span>

//             <span
//               className={`flex-1 text-left transition-all ease-in-out font-medium ${
//                 isActive ? "text-primary" : ""
//               } ${
//                 isCollapsed
//                   ? "opacity-0 pointer-events-none duration-0"
//                   : "opacity-100 delay-300 duration-700 pointer-events-auto"
//               }`}
//             >
//               {item.label}
//             </span>
//             <FaAngleRight
//               className={`transform transition-transform ${
//                 isActive ? "text-primary" : ""
//               } ${
//                 isOpen
//                   ? "rotate-90 duration-300"
//                   : isCollapsed
//                   ? "opacity-0 pointer-events-none duration-0"
//                   : "opacity-100 delay-300 duration-700 pointer-events-auto"
//               }`}
//             />
//           </button>

//           <div
//             className={`overflow-hidden transition-all duration-300 ease-in-out ${
//               isOpen ? "max-h-60" : "max-h-0"
//             }`}
//           >
//             {/* Submenu with sideline */}
//             <ul className="relative pl-8 py-1">
//               {/* Vertical line */}
//               <div className={`absolute left-8 top-0 bottom-0 w-px ${
//                 isActive ? "bg-primary/30" : "bg-border"
//               }`}></div>

//               {item.submenu?.map((subItem) => {
//                 const isSubItemActive = activeSubItem === subItem.id;
                
//                 return (
//                   <li key={subItem.id} className="relative">
//                     {/* Horizontal line connecting to the vertical line */}
//                     <div className={`absolute left-0 top-1/2 w-4 h-px ${
//                       isActive ? "bg-primary/30" : "bg-border"
//                     }`}></div>

//                     <Link
//                       href={subItem.link}
//                       className={`block py-4 transition-all ease-in-out pl-8 rounded-md ${
//                         isSubItemActive
//                           ? "text-primary font-medium ml-2"
//                           : "hover:text-surface-900 text-surface-800 hover:bg-surface-50"
//                       } ${
//                         isCollapsed
//                           ? "opacity-0 pointer-events-none duration-0"
//                           : "opacity-100 delay-300 duration-700 pointer-events-auto"
//                       }`}
//                     >
//                       {subItem.label}
//                     </Link>
//                   </li>
//                 );
//               })}
//             </ul>
//           </div>
//         </li>
//       );
//     }

//     return null;
//   };

//   return (
//     <nav
//       className={`max-w-72 ${
//         isCollapsed ? "w-24 min-w-24" : "w-72 min-w-72"
//       } sticky top-0 left-0 bg-background border-r border-border h-screen flex flex-col shadow-lg transition-all duration-700 ease-in-out z-50`}
//     >
//       <div
//         className="absolute cursor-pointer -right-5 top-[4.95rem] p-2 border-border border-2 rounded-full bg-surface-100 hover:bg-surface-200 transition-colors"
//         onClick={toggleCollapsible}
//       >
//         <FaChevronLeft
//           className={`text-lg text-foreground ${
//             isCollapsed ? "rotate-180" : "rotate-0"
//           } transition-transform duration-700 ease-in-out`}
//         />
//       </div>
      
//       <div className="h-full flex flex-col transition-opacity ease-in-out">
//         <div className="py-[1.5625rem] min-h-[6rem] max-h-[6rem] flex">
//           <Link
//             href="/"
//             className={`flex items-start text-primary ${
//               isCollapsed ? "justify-center translate-x-4" : "justify-start"
//             }`}
//           >
//             <img src="/atv.svg" alt="logo" className="h-10" />
//             <div
//               className={`flex flex-col ${
//                 isCollapsed
//                   ? "opacity-0 pointer-events-none duration-0 absolute"
//                   : "opacity-100 delay-700 duration-700 pointer-events-auto"
//               }`}
//             >
//               <span className="text-lg font-semibold text-foreground underline underline-offset-4">
//                 ATV Platform
//               </span>
//               <span className="text-sm text-gray-600 line-clamp-1">
//                 Content Management System
//               </span>
//             </div>
//           </Link>
//         </div>

//         <hr className="m-0 text-border h-[0.125rem]" />
        
//         <div className="py-[1.5625rem] min-h-[6rem] max-h-[6rem] flex">
//           <div
//             className={`flex items-start text-primary ${
//               isCollapsed ? "justify-center translate-x-4" : "justify-start"
//             }`}
//           >
//             <img src="/atv.svg" alt="logo" className="h-10" />
//             <div
//               className={`flex flex-col ${
//                 isCollapsed
//                   ? "opacity-0 pointer-events-none duration-0 absolute"
//                   : "opacity-100 delay-700 duration-700 pointer-events-auto"
//               }`}
//             >
//               <span className="text-md text-foreground">Avatar</span>
//               <span className="text-sm text-gray-600 line-clamp-1">
//                 Administrator
//               </span>
//             </div>
//           </div>
//         </div>

//         <div
//           className={`overflow-y-auto flex-1 ${
//             isCollapsed
//               ? "px-[1.375rem] overflow-x-hidden hide-scroll-bar"
//               : "px-2 scrollbar-bg"
//           }`}
//         >
//           {navigationSections.map((section) => (
//             <div key={section.title} className="mb-2">
//               <h5
//                 className={`text-sm uppercase font-semibold text-gray-500 px-4 mt-4 mb-2 ${
//                   isCollapsed
//                     ? "opacity-0 absolute pointer-events-none duration-0"
//                     : "opacity-100 delay-300 duration-700 pointer-events-auto"
//                 }`}
//               >
//                 {section.title}
//               </h5>

//               <ul className="space-y-1">
//                 {section.items.map((item) => renderMenuItem(item))}
//               </ul>
//             </div>
//           ))}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Sidebar;


"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useEffect } from "react";
import { FaAngleRight, FaChevronLeft } from "react-icons/fa6";
import { usePathname } from "next/navigation";

import {
  Folder03Icon,
  Home05Icon,
  Legal01Icon,
  News01Icon,
  Settings01Icon,
  Tv01Icon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getSidebarApi } from "@/api/auth/misc";
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

const Sidebar = () => {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<any>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("");
  const [activeSubItem, setActiveSubItem] = useState("");
  const [tempOpenMenus, setTempOpenMenus] = useState<any>({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize navigationSections as an empty array with proper typing
  const [navigationSections, setNavigationSections] = useState<NavigationSection[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryFn: getSidebarApi,
    queryKey: ['sidebar']
  });

  // Helper function to check if a path is active
const isPathActive = (itemPath: string, currentPath: string) => {
  if (itemPath === "/" && currentPath === "/") return true;
  if (!itemPath || itemPath === "/") return false;

  const escaped = itemPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|/)${escaped}(?=/|$)`);

  return regex.test(currentPath);
};
  // Helper function to find active items based on current pathname
  const findActiveItems = () => {
    let foundActiveItem = "";
    let foundActiveSubItem = "";
    let menusToOpen: any = {};

    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.type === "link" && item.link) {
          if (isPathActive(item.link, pathname)) {
            foundActiveItem = item.id;
          }
        } else if (item.type === "submenu" && item.submenu) {
          const activeSubItem = item.submenu.find(subItem => 
            isPathActive(subItem.link, pathname)
          );
          if (activeSubItem) {
            foundActiveItem = item.id;
            foundActiveSubItem = activeSubItem.id;
            menusToOpen[item.id] = true;
          }
        }
      });
    });

    return { foundActiveItem, foundActiveSubItem, menusToOpen };
  };

  // Load state from sessionStorage
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
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading sidebar state from sessionStorage:', error);
      setIsInitialized(true);
    }
  }, []);

  // Update active items when pathname or navigationSections change
  useEffect(() => {
    if (navigationSections.length > 0 && isInitialized) {
      const { foundActiveItem, foundActiveSubItem, menusToOpen } = findActiveItems();
      
      setActiveItem(foundActiveItem);
      setActiveSubItem(foundActiveSubItem);
      
      // Get saved collapsed state
      const savedCollapsed = isCollapsed;
      
      if (savedCollapsed) {
        // If sidebar is collapsed on reload, don't open any menus but save which should be open
        setOpenMenus({});
        // Update tempOpenMenus to include menus that should be open based on current path
        setTempOpenMenus((prev: any) => ({
          ...prev,
          ...menusToOpen
        }));
        saveToStorage('sidebar-temp-open-menus', {
          ...tempOpenMenus,
          ...menusToOpen
        });
      } else {
        // If sidebar is expanded, open menus based on current path and previously saved state
        const menusToOpenFinal = {
          ...tempOpenMenus, // Restore previously saved open menus
          ...menusToOpen    // Add menus that should be open based on current path
        };
        setOpenMenus(menusToOpenFinal);
      }
    }
  }, [pathname, navigationSections, isInitialized]);

  // Save state to sessionStorage
  const saveToStorage = (key: string, value: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to sessionStorage:`, error);
    }
  };

  // Use useEffect to set the initial data
  useEffect(() => {
    data && data.mainData && setNavigationSections(data.mainData.sections);
  }, [data]);

  const toggleMenu = (menu: any) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    
    const newOpenMenus = {
      ...openMenus,
      [menu]: !openMenus[menu],
    };
    
    setOpenMenus(newOpenMenus);
  };

  const toggleCollapsible = () => {
    const newCollapsedState = !isCollapsed;
    
    if (!isCollapsed) {
      // Collapsing: save current open menus and close all
      setTempOpenMenus(openMenus);
      setOpenMenus({});
      saveToStorage('sidebar-temp-open-menus', openMenus);
    } else {
      // Expanding: restore previously open menus
      setOpenMenus(tempOpenMenus);
      setTempOpenMenus({});
      saveToStorage('sidebar-temp-open-menus', {});
    }
    
    setIsCollapsed(newCollapsedState);
    saveToStorage('sidebar-collapsed', newCollapsedState);
  };

  // Show loading state while navigationSections is empty
  if (navigationSections.length === 0) {
    return (
      <div className="max-w-72 w-72 min-w-72 bg-background border-r border-border h-screen flex items-center justify-center">
        <div className="text-surface-600">Loading...</div>
      </div>
    );
  }

  // Render a single menu item (either link or submenu)
  const renderMenuItem = (item: NavigationItem) => {
    const isOpen = openMenus[item.id];
    const isActive = activeItem === item.id;

    // Common classes for menu items
    const commonClasses =
      "flex items-center w-full px-4 py-4 transition-colors duration-200 rounded-lg cursor-pointer";
    
    const activeClasses = isActive
      ? isCollapsed
        ? "pr-[2.55rem] bg-primary/30 text-primary border-r-2 border-primary"
        : "bg-primary/20 text-primary border-l-4 border-primary"
      : isCollapsed
      ? "pr-[2.55rem] hover:bg-surface-100 text-surface-600"
      : "hover:bg-surface-100 text-surface-600";

    if (item.type === "link") {
      return (
        <li key={item.id}>
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
                  : "opacity-100 delay-300 duration-700 pointer-events-auto"
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
        <li key={item.id}>
          <button
            onClick={() => toggleMenu(item.id)}
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
                  : "opacity-100 delay-300 duration-700 pointer-events-auto"
              }`}
            >
              {item.label}
            </span>
            <FaAngleRight
              className={`transform transition-transform ${
                isActive ? "text-primary" : ""
              } ${
                isOpen
                  ? "rotate-90 duration-300"
                  : isCollapsed
                  ? "opacity-0 pointer-events-none duration-0"
                  : "opacity-100 delay-300 duration-700 pointer-events-auto"
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isOpen && !isCollapsed ? "max-h-60" : "max-h-0"
            }`}
          >
            {/* Submenu with sideline */}
            <ul className="relative pl-8 py-1">
              {/* Vertical line */}
              <div className={`absolute left-8 top-0 bottom-0 w-px ${
                isActive ? "bg-primary" : "bg-border"
              }`}></div>

              {item.submenu?.map((subItem) => {
                const isSubItemActive = activeSubItem === subItem.id;
                
                return (
                  <li key={subItem.id} className="relative">
                    {/* Horizontal line connecting to the vertical line */}
                    <div className={`absolute left-0 top-1/2 w-4 h-px ${
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
                          : "opacity-100 delay-300 duration-700 pointer-events-auto"
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
  };

  return (
    <nav
      className={`max-w-72 ${
        isCollapsed ? "w-24 min-w-24" : "w-72 min-w-72"
      } sticky top-0 left-0 bg-background border-r border-border h-screen flex flex-col shadow-lg transition-all duration-700 ease-in-out z-50`}
    >
      <div
        className="absolute cursor-pointer -right-5 top-[4.95rem] p-2 border-border border-2 rounded-full bg-surface-100 hover:bg-surface-200 transition-colors"
        onClick={toggleCollapsible}
      >
        <FaChevronLeft
          className={`text-lg text-foreground ${
            isCollapsed ? "rotate-180" : "rotate-0"
          } transition-transform duration-700 ease-in-out`}
        />
      </div>
      
      <div className="h-full flex flex-col transition-opacity ease-in-out">
        <div className="py-[1.5625rem] min-h-[6rem] max-h-[6rem] flex">
          <Link
            href="/"
            className={`flex items-start text-primary ${
              isCollapsed ? "justify-center translate-x-4" : "justify-start"
            }`}
          >
            <img src="/atv.svg" alt="logo" className="h-10" />
            <div
              className={`flex flex-col ${
                isCollapsed
                  ? "opacity-0 pointer-events-none duration-0 absolute"
                  : "opacity-100 delay-700 duration-700 pointer-events-auto"
              }`}
            >
              <span className="text-lg font-semibold text-foreground underline underline-offset-4">
                ATV Platform
              </span>
              <span className="text-sm text-gray-600 line-clamp-1">
                Content Management System
              </span>
            </div>
          </Link>
        </div>

        <hr className="m-0 text-border h-[0.125rem]" />
        
        <div className="py-[1.5625rem] min-h-[6rem] max-h-[6rem] flex">
          <div
            className={`flex items-start text-primary ${
              isCollapsed ? "justify-center translate-x-4" : "justify-start"
            }`}
          >
            <img src="/atv.svg" alt="logo" className="h-10" />
            <div
              className={`flex flex-col ${
                isCollapsed
                  ? "opacity-0 pointer-events-none duration-0 absolute"
                  : "opacity-100 delay-700 duration-700 pointer-events-auto"
              }`}
            >
              <span className="text-md text-foreground">Avatar</span>
              <span className="text-sm text-gray-600 line-clamp-1">
                Administrator
              </span>
            </div>
          </div>
        </div>

        <div
          className={`overflow-y-auto flex-1 ${
            isCollapsed
              ? "px-[1.375rem] overflow-x-hidden hide-scroll-bar"
              : "px-2 scrollbar-bg"
          }`}
        >
          {navigationSections.map((section) => (
            <div key={section.title} className="mb-2">
              <h5
                className={`text-sm uppercase font-semibold text-gray-500 px-4 mt-4 mb-2 ${
                  isCollapsed
                    ? "opacity-0 absolute pointer-events-none duration-0"
                    : "opacity-100 delay-300 duration-700 pointer-events-auto"
                }`}
              >
                {section.title}
              </h5>

              <ul className="space-y-1">
                {section.items.map((item) => renderMenuItem(item))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;