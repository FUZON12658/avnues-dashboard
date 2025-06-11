'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { DynamicForm } from '../../add-new/DynamicForm';
import { crAxios } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const Page = () => {
  const { slug, id } = useParams();
  const getEditDetailsApi = async (
  ) => {
    const response = await crAxios.get(`/api/v1/${slug}/${id}`);
    return response.data;
  };
  const {
    data,
    isLoading,
    error,
    refetch: viewDataRefetch,
  } = useQuery({
    queryKey: [`${slug}-${id}-view`],
    queryFn: getEditDetailsApi,
    select: (data)=>{return data.mainData}
  });

  return (
    <div className=" h-full">
      {data && <DynamicForm formDataSupplied={data} suppliedId={id as string} />}
    </div>
  );
};

export default Page;
