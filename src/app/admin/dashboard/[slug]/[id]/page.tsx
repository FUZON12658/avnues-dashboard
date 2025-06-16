"use client";
import JsonDrivenDashboard from '@/components/common/modern-table-page';
import { useParams } from 'next/navigation';
import React from 'react'


const page = () => {
  const {slug, id} = useParams();
  const fetchLink = localStorage.getItem('fetchLinkMainTableActions');
  return (
    <div>
      <JsonDrivenDashboard id={id as string} fetchLink={fetchLink} />
    </div>
  )
}

export default page
