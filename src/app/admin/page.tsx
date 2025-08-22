// 'use client';
// import React from 'react';
// import Combobox from '@/components/ui/dropdown-menu';
// import { FileUploader } from '@/components/ui/fileuploader';
// import { Input, IconInput } from '@/components/ui/input';
// import Image from 'next/image';
// import MultiSelect from '@/components/ui/multi-select';
// import IconCombobox from '@/components/ui/icon-dropdown-menu';
// import ModalExample from '@/components/common/modal=example';
// import { Textarea } from '@/components/ui/textarea';

// export default function Home() {
//   const options = [
//     { value: 'apple', label: 'Apple' },
//     { value: 'banana', label: 'Banana' },
//     { value: 'orange', label: 'Orange' },
//     { value: 'grape', label: 'Grape' },
//     { value: 'strawberry', label: 'Strawberry' },
//     { value: 'mango', label: 'Mango' },
//     { value: 'kiwi', label: 'Kiwi' },
//   ];
//   const searchIcon = (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       width="18"
//       height="18"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <circle cx="11" cy="11" r="8"></circle>
//       <path d="m21 21-4.3-4.3"></path>
//     </svg>
//   );
//   const iconOptions = [
//     {
//       value: 'dashboard',
//       label: 'Dashboard',
//       icon: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="16"
//           height="16"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         >
//           <rect width="7" height="9" x="3" y="3" rx="1"></rect>
//           <rect width="7" height="5" x="14" y="3" rx="1"></rect>
//           <rect width="7" height="9" x="14" y="12" rx="1"></rect>
//           <rect width="7" height="5" x="3" y="16" rx="1"></rect>
//         </svg>
//       ),
//     },
//     {
//       value: 'settings',
//       label: 'Settings',
//       icon: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="16"
//           height="16"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         >
//           <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
//           <circle cx="12" cy="12" r="3"></circle>
//         </svg>
//       ),
//     },
//     {
//       value: 'profile',
//       label: 'User Profile',
//       icon: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="16"
//           height="16"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         >
//           <circle cx="12" cy="8" r="5"></circle>
//           <path d="M20 21a8 8 0 1 0-16 0"></path>
//         </svg>
//       ),
//     },
//     {
//       value: 'notifications',
//       label: 'Notifications',
//       icon: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="16"
//           height="16"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         >
//           <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
//           <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
//         </svg>
//       ),
//     },
//     {
//       value: 'messages',
//       label: 'Messages',
//       icon: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="16"
//           height="16"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         >
//           <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
//         </svg>
//       ),
//     },
//   ];
//   const [selectedFruits, setSelectedFruits] = React.useState<string[]>([]);
//   return (
//     <div className="flex flex-col items-center justify-center m-10 gap-4">
//       <Input />
//       <Textarea />
//       <FileUploader />
//       <FileUploader multiple={true} />
//       <Combobox options={options} />
//       <MultiSelect
//         options={options}
//         placeholder="Select fruits"
//         onChange={(values) => setSelectedFruits(values)}
//       />
//       <IconInput
//         icon={
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="20"
//             height="20"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           >
//             <circle cx="11" cy="11" r="8"></circle>
//             <path d="m21 21-4.3-4.3"></path>
//           </svg>
//         }
//         inputProps={{
//           placeholder: 'Search...',
//         }}
//       />
//       <IconInput
//         iconSrc="https://picsum.photos/20/20"
//         iconAlt="User"
//         inputProps={{
//           placeholder: 'Username',
//         }}
//       />
//       <IconInput
//         icon={
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="20"
//             height="20"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           >
//             <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3Z"></path>
//             <path d="M8 17v1a4 4 0 0 0 8 0v-1"></path>
//           </svg>
//         }
//         iconClassName="text-primary"
//         inputProps={{
//           placeholder: 'Enter notification text',
//         }}
//       />
//       <IconCombobox
//         options={iconOptions}
//         placeholder="Select section"
//         leftIcon={searchIcon}
//         onChange={(value) => console.log('Selected:', value)}
//       />
//       <ModalExample />
//     </div>
//   );
// }

import React from 'react'

const page = () => {
  return (
    <div className='flex items-center justify-center w-full h-full'>
      Welcome to Avnues CMS Admin
    </div>
  )
}

export default page
