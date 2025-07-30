import React from 'react'
export const useDeepCompareMemo = <T>(factory: () => T, deps: React.DependencyList): T => {
  const ref = React.useRef<T>(null);
  const signalRef = React.useRef<number>(0);
  
  const depsString = JSON.stringify(deps);
  const prevDepsString = React.useRef<string>(null);
  
  if (prevDepsString.current !== depsString) {
    ref.current = factory();
    prevDepsString.current = depsString;
    signalRef.current += 1;
  }
  
  return React.useMemo(() => ref.current!, [signalRef.current]);
};