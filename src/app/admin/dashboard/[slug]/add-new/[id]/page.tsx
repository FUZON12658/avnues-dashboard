"use client";
import { useParams } from "next/navigation";
import { DynamicForm } from "../DynamicForm";
import { useQuery } from "@tanstack/react-query";
import { crAxios } from "@/api";

const page = () => {
  const {slug, id} = useParams();
  const fixedParentLabel = localStorage.getItem("DynamicFormFixedParentLabel")
  const fetchParentDetailsLink = localStorage.getItem("DynamicFormParentsDetailsFetchLink")
  const fixedParentId = localStorage.getItem("DynamicFormOmitParentId")
  const fixedParentKeyToShow = localStorage.getItem("DynamicFormFixedParentKeyToShow")

  const getParentDetailsApi = async() =>{
    const { data } = await crAxios.get(fetchParentDetailsLink);
    return data;
  }

  const {data, isLoading, isError} = useQuery({
    queryFn: getParentDetailsApi,
    queryKey: [fetchParentDetailsLink],
    select: (data)=>{return data.mainData}
    
  })

  if(isLoading||isError||!data){
    return <div>Loading...</div>
  }

  const parentDetailsToPass = {
    value: data.id,
    label: data[fixedParentKeyToShow as string],
  }
  return(
    <DynamicForm fixedParentKey={fixedParentId} fixedParentDetails={parentDetailsToPass} fixedParentLabel={fixedParentLabel} fixedParentKeyToShow={fixedParentKeyToShow} />
  );
}

export default page