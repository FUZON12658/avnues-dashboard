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

export const useDeepCompareEffect = (
  effect: React.EffectCallback,
  deps: React.DependencyList
) => {
  const previousDepsRef = React.useRef<string | null>(null);
  const cleanupRef = React.useRef<ReturnType<React.EffectCallback>>(null);

  const currentDepsString = JSON.stringify(deps);

  if (previousDepsRef.current !== currentDepsString) {
    previousDepsRef.current = currentDepsString;

    // If there was a previous cleanup function, call it
    if (typeof cleanupRef.current === 'function') {
      cleanupRef.current();
    }

    // Re-run effect and store cleanup function
    cleanupRef.current = effect();
  }

  React.useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
    };
  }, []);
};