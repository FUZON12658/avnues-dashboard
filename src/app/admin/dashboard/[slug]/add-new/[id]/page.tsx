// "use client";
// import { useParams } from "next/navigation";
// import { DynamicForm } from "../DynamicForm";
// import { useQuery } from "@tanstack/react-query";
// import { crAxios } from "@/api";

// const page = () => {
//   const { slug, id } = useParams();

//   // Get fixed parents configuration
//   const fixedParentsJson = localStorage.getItem("DynamicFormFixedParents");
//   const fixedParents = fixedParentsJson ? JSON.parse(fixedParentsJson) : [];

//   // Create API calls for dynamic parents only
//   const getParentDetails = async (fetchLink: string) => {
//     const { data } = await crAxios.get(fetchLink);
//     return data;
//   };

//   // Separate dynamic and static parents
//   const dynamicParents = fixedParents.filter((parent: any) => parent.fetchDetailsLink);
//   const staticParents = fixedParents.filter((parent: any) => parent.value !== undefined);

//   // Use multiple queries for each dynamic parent
//   const parentQueries = dynamicParents.map((parent: any, index: number) => {
//     return useQuery({
//       queryFn: () => getParentDetails(parent.fetchDetailsLink),
//       queryKey: [`parent-${index}`, parent.fetchDetailsLink],
//       select: (data) => ({ ...data.mainData }),
//       enabled: !!parent.fetchDetailsLink,
//       // If parent is discardable, don't retry on error
//       retry: parent.discardable ? false : 3,
//     });
//   });

//   // Check loading and error states only for non-discardable dynamic queries
//   const isLoading = parentQueries.some((query: any, index: number) => {
//     const parent = dynamicParents[index];
//     // Only consider loading state for non-discardable parents
//     return !parent.discardable && query.isLoading;
//   });

//   const isError = parentQueries.some((query: any, index: number) => {
//     const parent = dynamicParents[index];
//     // Only consider error state for non-discardable parents
//     return !parent.discardable && query.isError;
//   });

//   const hasRequiredData = parentQueries.every((query: any, index: number) => {
//     const parent = dynamicParents[index];
//     // For discardable parents, we don't care about their state
//     if (parent.discardable) return true;
//     // For non-discardable parents, they must have data or be disabled
//     return query.data || !query.isEnabled;
//   });

//   // Show loading only if non-discardable queries are still loading or have errors
//   if (isLoading || isError || !hasRequiredData) {
//     return <div>Loading...</div>;
//   }

//   console.log(parentQueries);

//   // Process dynamic parent details for the form
//   const processedDynamicParents = parentQueries
//     .map((query: any, index: number) => {
//       const parent = dynamicParents[index];

//       // If parent is discardable and has error, skip it silently
//       if (parent.discardable && query.isError) {
//         console.log(`Discarding parent ${parent.label} due to error (discardable):`, query.error);
//         return null;
//       }

//       // If parent is discardable and has no data, skip it silently
//       if (parent.discardable && !query.data) {
//         console.log(`Discarding parent ${parent.label} - no data (discardable)`);
//         return null;
//       }

//       // If parent is not discardable but has error/no data, this should have been caught above
//       if (!parent.discardable && (query.isError || !query.data)) {
//         return null;
//       }

//       console.log(query.data);
//       const data = query.data;

//       return {
//         key: parent.id,
//         label: parent.label,
//         keyToShow: parent.keyToShow,
//         details: {
//           value: data.id,
//           label: data[parent.keyToShow],
//         }
//       };
//     })
//     .filter(Boolean); // Remove null entries

//   // Process static parent details for the form
//   const processedStaticParents = staticParents.map((parent: any) => {
//     console.log(`Processing static parent ${parent.label} with value:`, parent.value);

//     return {
//       key: parent.id,
//       label: parent.label,
//       keyToShow: parent.keyToShow || 'label', // fallback to 'label' if keyToShow not provided
//       details: {
//         value: parent.value,
//         label: parent.label || parent.value, // use label if provided, otherwise use value
//       }
//     };
//   });

//   // Combine both dynamic and static processed parents
//   const processedParents = [...processedDynamicParents, ...processedStaticParents];

//   console.log(processedParents);
//   console.log("Processed parents here");

//   return (
//     <DynamicForm fixedParents={processedParents} suppliedId={id as string} />
//   );
// };

// export default page;

"use client";
import { useParams } from "next/navigation";
import { DynamicForm } from "../DynamicForm";
import { useQuery } from "@tanstack/react-query";
import { crAxios } from "@/api";

const page = () => {
  const { slug, id } = useParams();

  // Get fixed parents configuration
  const fetchLink = localStorage.getItem("fetchLinkMainTableActions");
  const fixedParentsJson = localStorage.getItem("DynamicFormFixedParents");
  const fixedParents = fixedParentsJson ? JSON.parse(fixedParentsJson) : [];

  // Create API calls for dynamic parents only
  const getParentDetails = async (fetchLink: string) => {
    const { data } = await crAxios.get(fetchLink);
    return data;
  };

  // Separate dynamic and static parents
  const dynamicParents = fixedParents.filter(
    (parent: any) => parent.fetchDetailsLink
  );
  const staticParents = fixedParents.filter(
    (parent: any) => parent.value !== undefined && !parent.fetchDetailsLink
  );

  // Use multiple queries for each dynamic parent
  const parentQueries = dynamicParents.map((parent: any, index: number) => {
    return useQuery({
      queryFn: () => getParentDetails(parent.fetchDetailsLink),
      queryKey: [`parent-${index}`, parent.fetchDetailsLink],
      select: (data) => ({ ...data.mainData }),
      enabled: !!parent.fetchDetailsLink,
      // If parent is discardable, don't retry on error
      retry: parent.discardable ? false : 3,
    });
  });

  // Check loading and error states only for non-discardable dynamic queries
  const isLoading = parentQueries.some((query: any, index: number) => {
    const parent = dynamicParents[index];
    // Only consider loading state for non-discardable parents
    return !parent.discardable && query.isLoading;
  });

  const isError = parentQueries.some((query: any, index: number) => {
    const parent = dynamicParents[index];
    // Only consider error state for non-discardable parents
    return !parent.discardable && query.isError;
  });

  const hasRequiredData = parentQueries.every((query: any, index: number) => {
    const parent = dynamicParents[index];
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

  // Process dynamic parent details for the form
  const processedDynamicParents = parentQueries
    .map((query: any, index: number) => {
      const parent = dynamicParents[index];

      // If parent is discardable and has error, skip it silently
      if (parent.discardable && query.isError) {
        console.log(
          `Discarding parent ${parent.label} due to error (discardable):`,
          query.error
        );
        return null;
      }

      // If parent is discardable and has no data, skip it silently
      if (parent.discardable && !query.data) {
        console.log(
          `Discarding parent ${parent.label} - no data (discardable)`
        );
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
        },
      };
    })
    .filter(Boolean); // Remove null entries

  // Process static parent details for the form
  const processedStaticParents = staticParents.map((parent: any) => {
    console.log(
      `Processing static parent ${parent.label} with value:`,
      parent.value
    );

    return {
      key: parent.id,
      label: parent.label,
      keyToShow: parent.keyToShow || "value", // fallback to 'value' if keyToShow not provided
      details: {
        value: parent.value,
        label: parent.label, // use the label from the parent config
      },
    };
  });

  // Combine both dynamic and static processed parents
  const processedParents = [
    ...processedDynamicParents,
    ...processedStaticParents,
  ];

  console.log(processedParents);
  console.log("Processed parents here");

  return (
    <DynamicForm fixedParents={processedParents} suppliedId={id as string} fetchLink={fetchLink} />
  );
};

export default page;
