// "use client";
// import { useParams } from "next/navigation";
// import { DynamicForm } from "../DynamicForm";
// import { useQuery } from "@tanstack/react-query";
// import { crAxios } from "@/api";

// const page = () => {
//   const {slug, id} = useParams();
//   const fixedParentLabel = localStorage.getItem("DynamicFormFixedParentLabel")
//   const fetchParentDetailsLink = localStorage.getItem("DynamicFormParentsDetailsFetchLink")
//   const fixedParentId = localStorage.getItem("DynamicFormOmitParentId")
//   const fixedParentKeyToShow = localStorage.getItem("DynamicFormFixedParentKeyToShow")

//   const getParentDetailsApi = async() =>{
//     const { data } = await crAxios.get(fetchParentDetailsLink);
//     return data;
//   }

//   const {data, isLoading, isError} = useQuery({
//     queryFn: getParentDetailsApi,
//     queryKey: [fetchParentDetailsLink],
//     select: (data)=>{return data.mainData}
    
//   })

//   if(isLoading||isError||!data){
//     return <div>Loading...</div>
//   }

//   const parentDetailsToPass = {
//     value: data.id,
//     label: data[fixedParentKeyToShow as string],
//   }
//   return(
//     <DynamicForm fixedParentKey={fixedParentId} fixedParentDetails={parentDetailsToPass} fixedParentLabel={fixedParentLabel} fixedParentKeyToShow={fixedParentKeyToShow} />
//   );
// }

// export default page

"use client";
import { useParams } from "next/navigation";
import { DynamicForm } from "../DynamicForm";
import { useQuery } from "@tanstack/react-query";
import { crAxios } from "@/api";

const page = () => {
  const { slug, id } = useParams();

  // Get fixed parents configuration
  const fixedParentsJson = localStorage.getItem("DynamicFormFixedParents");
  const fixedParents = fixedParentsJson ? JSON.parse(fixedParentsJson) : [];

  // Create API calls for all parents
  const getParentDetails = async (fetchLink: string) => {
    const { data } = await crAxios.get(fetchLink);
    return data;
  };

  // Use multiple queries for each parent
  const parentQueries = fixedParents.map((parent: any, index: number) => {
    return useQuery({
      queryFn: () => getParentDetails(parent.fetchDetailsLink),
      queryKey: [`parent-${index}`, parent.fetchDetailsLink],
      select: (data) => ({ ...data.mainData }),
      enabled: !!parent.fetchDetailsLink,
      // If parent is discardable, don't retry on error
      retry: parent.discardable ? false : 3,
    });
  });

  // Check loading and error states only for non-discardable queries
  const isLoading = parentQueries.some((query: any, index: number) => {
    const parent = fixedParents[index];
    // Only consider loading state for non-discardable parents
    return !parent.discardable && query.isLoading;
  });

  const isError = parentQueries.some((query: any, index: number) => {
    const parent = fixedParents[index];
    // Only consider error state for non-discardable parents
    return !parent.discardable && query.isError;
  });

  const hasRequiredData = parentQueries.every((query: any, index: number) => {
    const parent = fixedParents[index];
    // For discardable parents, we don't care about their state
    if (parent.discardable) return true;
    // For non-discardable parents, they must have data or be disabled
    return query.data || !query.isEnabled;
  });

  // Show loading only if non-discardable queries are still loading or have errors
  if (isLoading || isError || !hasRequiredData) {
    return <div>Loading...</div>;
  }

  console.log(parentQueries);

  // Process parent details for the form
  const processedParents = parentQueries
    .map((query: any, index: number) => {
      const parent = fixedParents[index];
      
      // If parent is discardable and has error, skip it silently
      if (parent.discardable && query.isError) {
        console.log(`Discarding parent ${parent.label} due to error (discardable):`, query.error);
        return null;
      }
      
      // If parent is discardable and has no data, skip it silently
      if (parent.discardable && !query.data) {
        console.log(`Discarding parent ${parent.label} - no data (discardable)`);
        return null;
      }
      
      // If parent is not discardable but has error/no data, this should have been caught above
      if (!parent.discardable && (query.isError || !query.data)) {
        return null;
      }

      console.log(query.data);
      const data = query.data;

      return {
        key: parent.id,
        label: parent.label,
        keyToShow: parent.keyToShow,
        details: {
          value: data.id,
          label: data[parent.keyToShow],
        }
      };
    })
    .filter(Boolean); // Remove null entries

  return (
    <DynamicForm fixedParents={processedParents} suppliedId={id as string} />
  );
};

export default page;