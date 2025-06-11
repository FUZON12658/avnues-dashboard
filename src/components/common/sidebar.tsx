'use client';
import React, { useState } from 'react';
import {
  FaHouse,
  FaAngleRight,
  FaCartShopping,
  FaPercent,
  FaUserTie,
  FaUser,
  FaFolder,
  FaGear,
  FaChevronLeft,
} from 'react-icons/fa6';
import { HugeiconsIcon } from '@hugeicons/react'
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

import { Comment01Icon, Coupon01Icon, CourseIcon, File01Icon, Folder03Icon, Home05Icon, News01Icon, Settings01Icon, ShoppingCart01Icon, TeachingIcon, Tv01Icon, UserGroup03Icon } from '@hugeicons/core-free-icons'
import { FaFile, FaComment } from 'react-icons/fa';
import { FaNewspaper, FaBookOpen } from 'react-icons/fa6';
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
            { label: 'News', link: '/admin/dashboard/articles', endpoint: '' },
            { label: 'News Category', link: '/admin/dashboard/article-category', endpoint: '' },
          ],
        },
        {
          label: 'Programs',
          icon: Tv01Icon,
          type: 'submenu',
          id: 'programs',
          submenu: [
            { label: 'Program', link: '/admin/dashboard/programs', endpoint: '' },
            { label: 'Part', link: '/admin/dashboard/programs-part', endpoint: '' },
            { label: 'Episode', link: '/admin/dashboard/programs-episode', endpoint: '' },
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
      title: 'Advance',
      items: [
        {
          label: 'Users',
          icon: UserGroup03Icon,
          link: '/admin/dashboard/users',
          endpoint: '',
          type: 'link',

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
          link: '/',
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
      : isCollapsed ? "pr-[2.55rem] hover:bg-surface-100  text-surface-600" :'hover:bg-surface-100  text-surface-600 ';

    if (item.type === 'link') {
      return (
        <li key={item.label} onClick={() => setActiveItem(item.label)}>
          <Link
            href={item.link}
            className={`${commonClasses} ${activeClasses}`}
          >
            <span className="mr-3 -mt-1"><HugeiconsIcon icon={item.icon} /></span>
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
            <span className="mr-3"><HugeiconsIcon icon={item.icon} /></span>

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
      className={`${
        isCollapsed ? 'w-24' : 'w-96'
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
        <div className="px-4 py-[0.8125rem] rounded-sm bg-surface-300  m-4 flex">
          <Link
            href="/"
            className="flex items-center space-x-2 mx-auto text-primary"
          >
            <img
              src="https://picsum.photos/200/300"
              alt="logo"
              className="h-10"
            />
          </Link>
        </div>

        <hr className="m-0 text-border h-[0.125rem]" />
        <div
          className={`m-4 w-auto  rounded-sm bg-surface-200 mb-2 ${
            isCollapsed ? 'p-2' : 'p-4'
          }`}
        >
          <div
            className={`flex w-full h-full relative items-center ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <img
              src="https://picsum.photos/200/300"
              alt="user"
              className={`h-11 w-11 shadow-sm ${
                isCollapsed ? 'rounded-sm' : 'rounded-full'
              }`}
            />
            <div
              className={`left-16 absolute ${
                isCollapsed
                  ? 'opacity-0  pointer-events-none duration-0 '
                  : 'opacity-100  delay-700 duration-700 pointer-events-auto'
              }`}
            >
              <h6 className="text-base text-foreground font-medium mb-0">
                Aagaman Sharma Pokharel
              </h6>
              <small className="text-surface-700 text-sm">Administrator</small>
            </div>
          </div>
        </div>

        <div
          className={`overflow-y-auto flex-1   ${
            isCollapsed ? 'px-[1.375rem] overflow-x-hidden hide-scroll-bar' : 'px-2 scrollbar-bg'
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
