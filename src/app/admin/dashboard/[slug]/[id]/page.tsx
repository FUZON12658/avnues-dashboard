"use client";
import JsonDrivenDashboard from '@/components/common/modern-table-page';
import { useParams } from 'next/navigation';
import React from 'react'


const page = () => {
  const {slug, id} = useParams();
  return (
    <div>
      <JsonDrivenDashboard id={id as string} />
    </div>
  )
}

export default page
