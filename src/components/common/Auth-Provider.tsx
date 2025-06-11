"use client";

import { refreshTokenAdminApi } from "@/api/auth/login";
import { logoutApi } from "@/api/auth/logout";
import { useGlobalStore } from "@/hooks/store";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { redirect, useRouter } from "next/navigation";
import { ReactNode, useEffect, useLayoutEffect, useState } from "react";

interface AuthProviderProps {
  session: string|null; // Adjust the type of `session` based on your actual data
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ session, children }) => {
  const authenticated = useGlobalStore((state:any) => state.authenticated);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authenticated);
  const login = useGlobalStore((state:any) => state.login);
  const logout = useGlobalStore((state:any) => state.logout);
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
    if (session && session.toString() !== 'e30=') {
      login();
    }
  }, [session, login]);

  const { isError } = useQuery({
    queryKey: ["refreshToken"],
    queryFn: refreshTokenAdminApi,
    refetchInterval: 600000,
    enabled: authenticated,
    refetchIntervalInBackground: true,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onError: () => {
      logout();
      window.location.reload();
    },
    onSuccess: () => {
      login();
    },
  });

  useEffect(() => {
    if (isError) {
      logout();
      
      // logoutMutation.mutate();
    }
    console.log(authenticated);
  }, [isError]);

  return <>{children}</>;
};

export { AuthProvider };
