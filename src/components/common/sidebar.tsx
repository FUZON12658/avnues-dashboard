'use client';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { FaAngleRight, FaChevronLeft } from 'react-icons/fa6';
// import {
//   House01Stroke,
//   ChevronRight01Stroke,
//   Cart01Stroke,
//   Discount01Stroke,
//   UserTie01Stroke,
//   User01Stroke,
//   Folder01Stroke,
//   Settings01Stroke,
//   ChevronLeft01Stroke,
// } from '@hugeicons/react';

import {
  Folder03Icon,
  Home05Icon,
  Legal01Icon,
  News01Icon,
  Settings01Icon,
  Tv01Icon,
  UserGroup03Icon,
} from '@hugeicons/core-free-icons';
import Link from 'next/link';

const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState<any>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [tempOpenMenus, setTempOpenMenus] = useState({});

  const toggleMenu = (menu: any) => {
    isCollapsed && setIsCollapsed(false);
    setOpenMenus((prev: any) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const toggleCollapsible = () => {
    !isCollapsed && setTempOpenMenus(openMenus);
    !isCollapsed && setOpenMenus({});
    isCollapsed && setOpenMenus(tempOpenMenus);
    isCollapsed && setTempOpenMenus({});
    setIsCollapsed(!isCollapsed);
  };

  // Navigation structure data
  const navigationSections = [
    {
      title: 'Navigation',
      items: [
        {
          label: 'Dashboard',
          icon: Home05Icon,
          link: '/',
          endpoint: '',
          type: 'link',
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          label: 'News',
          icon: News01Icon,
          type: 'submenu',
          id: 'news',
          submenu: [
            {
              label: 'News Category',
              link: '/admin/dashboard/article-category',
              endpoint: '',
            },
            { label: 'News', link: '/admin/dashboard/articles', endpoint: '' },
          ],
        },
        {
          label: 'Programs',
          icon: Tv01Icon,
          type: 'submenu',
          id: 'programs',
          submenu: [
            {
              label: 'Program',
              link: '/admin/dashboard/programs',
              endpoint: '',
            },
            {
              label: 'Part',
              link: '/admin/dashboard/programs-part',
              endpoint: '',
            },
            {
              label: 'Episode',
              link: '/admin/dashboard/programs-episode',
              endpoint: '',
            },
          ],
        },
      ],
    },
    // {
    //   title: 'Courses',
    //   items: [
    //     {
    //       label: 'Courses',
    //       icon: CourseIcon,
    //       type: 'submenu',
    //       id: 'courses',
    //       submenu: [
    //         { label: 'Add New', link: '/', endpoint: '' },
    //         { label: 'Courses', link: '/', endpoint: '' },
    //         { label: 'Category', link: '/', endpoint: '' },
    //       ],
    //     },
    //   ],
    // },
    {
      title: 'Advanced',
      items: [
        {
          label: 'Users',
          icon: UserGroup03Icon,
          link: '/admin/dashboard/users',
          endpoint: '',
          type: 'link',
        },
        {
          label: 'Policies and User Management',
          icon: Legal01Icon,
          type: 'submenu',
          id: 'policy-and-user-mgmt',
          submenu: [
            {
              label: 'Policies',
              link: '/admin/dashboard/policy',
              endpoint: '',
            },
            {
              label: 'Policy Group',
              link: '/admin/dashboard/policy-group',
              endpoint: '',
            },
          ],
        },
        {
          label: 'Media Manager',
          icon: Folder03Icon,
          link: '/admin/filemanager',
          endpoint: '',
          type: 'link',
        },
        {
          label: 'Settings',
          icon: Settings01Icon,
          link: '/admin/settings',
          endpoint: '',
          type: 'link',
        },
      ],
    },
  ];

  // Render a single menu item (either link or submenu)
  const renderMenuItem = (item: any) => {
    const isOpen = openMenus[item.id];
    const isActive = activeItem === item.label;

    // Common classes for menu items
    const commonClasses =
      'flex items-center w-full px-4 py-4 transition-colors duration-200 rounded-lg cursor-pointer';
    const activeClasses = isActive
      ? isCollapsed
        ? 'pr-[2.55rem] bg-primary/10 text-primary'
        : 'bg-surface-200'
      : isCollapsed
      ? 'pr-[2.55rem] hover:bg-surface-100  text-surface-600'
      : 'hover:bg-surface-100  text-surface-600 ';

    if (item.type === 'link') {
      return (
        <li key={item.label} onClick={() => setActiveItem(item.label)}>
          <Link
            href={item.link}
            className={`${commonClasses} ${activeClasses}`}
          >
            <span className="mr-3 -mt-1">
              <HugeiconsIcon icon={item.icon} />
            </span>
            {
              <span
                className={`transition-all ease-in-out ${
                  isCollapsed
                    ? 'opacity-0 pointer-events-none duration-0 '
                    : 'opacity-100 delay-300 duration-700 pointer-events-auto'
                }`}
              >
                {item.label}
              </span>
            }
          </Link>
        </li>
      );
    }

    if (item.type === 'submenu') {
      return (
        <li key={item.id} onClick={() => setActiveItem(item.label)}>
          <button
            onClick={() => toggleMenu(item.id)}
            className={`${commonClasses} ${activeClasses}`}
          >
            <span className="mr-3">
              <HugeiconsIcon icon={item.icon} />
            </span>

            <span
              className={`flex-1 text-left transition-all ease-in-out ${
                isCollapsed
                  ? 'opacity-0 pointer-events-none duration-0 '
                  : 'opacity-100 delay-300 duration-700 pointer-events-auto'
              } `}
            >
              {item.label}
            </span>
            <FaAngleRight
              className={`transform transition-transform   
                  
                  ${
                    isOpen
                      ? 'rotate-90 duration-300'
                      : isCollapsed
                      ? 'opacity-0 pointer-events-none duration-0 '
                      : 'opacity-100 delay-300 duration-700 pointer-events-auto'
                  }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out  ${
              isOpen ? 'max-h-60' : 'max-h-0'
            }`}
          >
            {/* Submenu with sideline */}
            <ul className={`relative pl-8 py-1 `}>
              {/* This is the vertical line/sideline */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-border"></div>

              {item.submenu.map((subItem: any, index: number) => (
                <li key={subItem.label} className="relative">
                  {/* This is the horizontal line connecting to the vertical line */}
                  <div className="absolute left-0 top-1/2 w-4 h-px bg-border"></div>

                  <Link
                    href={subItem.link}
                    className={`block py-4 transition-opacity ease-in-out hover:text-surface-900 text-surface-800 pl-8 ${
                      isCollapsed
                        ? 'opacity-0 pointer-events-none duration-0 '
                        : 'opacity-100 delay-300 duration-700 pointer-events-auto'
                    }`}
                  >
                    {subItem.label}
                  </Link>
                </li>
              ))}
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
        isCollapsed ? 'w-24 min-w-24' : 'w-72 min-w-72'
      } sticky top-0 left-0 bg-background border-r border-border h-screen flex flex-col shadow-lg transition-all duration-700 ease-in-out z-50`}
    >
      <div
        className="absolute cursor-pointer -right-5 top-[4.95rem] p-2 border-border border-2 rounded-full bg-surface-100"
        onClick={toggleCollapsible}
      >
        <FaChevronLeft
          className={`text-lg text-foreground ${
            isCollapsed ? 'rotate-180' : 'rotate-0'
          } transition-transform duration-700 ease-in-out`}
        />
      </div>
      <div className="h-full flex flex-col transition-opacity ease-in-out">
        <div className="py-[1.5625rem] min-h-[6rem] max-h-[6rem] flex">
          <Link
            href="/"
            className={`flex items-start text-primary ${
              isCollapsed ? 'justify-center translate-x-4' : 'justify-start'
            }`}
          >
            <img src="/atv.svg" alt="logo" className="h-10" />
            {
              <div
                className={`flex flex-col ${
                  isCollapsed
                    ? 'opacity-0  pointer-events-none duration-0 absolute'
                    : 'opacity-100  delay-700 duration-700 pointer-events-auto'
                }`}
              >
                <span className="text-lg font-semibold text-foreground underline underline-offset-4">
                  ATV Platform
                </span>
                <span className="text-sm text-gray-600 line-clamp-1">
                  Content Management System
                </span>
              </div>
            }
          </Link>
        </div>

        <hr className="m-0 text-border h-[0.125rem]" />
        <div className="py-[1.5625rem] min-h-[6rem] max-h-[6rem] flex">
          <div
            className={`flex items-start text-primary ${
              isCollapsed ? 'justify-center translate-x-4' : 'justify-start'
            }`}
          >
            <img src="/atv.svg" alt="logo" className="h-10" />
            {
              <div
                className={`flex flex-col ${
                  isCollapsed
                    ? 'opacity-0  pointer-events-none duration-0 absolute'
                    : 'opacity-100  delay-700 duration-700 pointer-events-auto'
                }`}
              >
                <span className="text-md text-foreground">Avatar</span>
                <span className="text-sm text-gray-600 line-clamp-1">
                  Administrator
                </span>
              </div>
            }
          </div>
        </div>

        <div
          className={`overflow-y-auto flex-1   ${
            isCollapsed
              ? 'px-[1.375rem] overflow-x-hidden hide-scroll-bar'
              : 'px-2 scrollbar-bg'
          }`}
        >
          {navigationSections.map((section) => (
            <div key={section.title} className="mb-2">
              <h5
                className={`text-sm uppercase font-semibold text-gray-500 px-4 mt-4 mb-2 ${
                  isCollapsed
                    ? 'opacity-0 absolute pointer-events-none duration-0 '
                    : 'opacity-100 delay-300 duration-700 pointer-events-auto'
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
