import React from 'react'

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