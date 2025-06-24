// "use client";

// import { loginAdminApi, loginOrganizationApi } from "@/api/auth/login";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { useGlobalStore } from "@/hooks/store";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useMutation } from "@tanstack/react-query";
// import { useForm } from "react-hook-form";
// import { toast } from "sonner";
// import { z } from "zod";
// import { useState } from "react";
// import { TwoFactorVerification } from "./Two-Factor-Verification-Component";

// const formSchema = z.object({
//   username: z
//     .string({ required_error: "Email is required." })
//     .min(4, { message: "Please enter a valid email or phonenumber." }),
//   password: z
//     .string()
//     .min(6, { message: "Password must be at least 6 characters long." }),
// });

// interface LoginFormValues {
//   username: string;
//   password: string;
// }

// interface LoginFormProps extends React.ComponentPropsWithoutRef<"form"> {
//   onSignupClick?: () => void;
//   isAdmin: boolean;
//   isClient: boolean;
// }

// interface TwoFactorResponse {
//   success: boolean;
//   data: {
//     two_step_verification: boolean;
//     user_id: string;
//   };
//   error: null;
// }

// export function LoginForm({
//   onSignupClick,
//   isAdmin,
//   isClient,
//   ...props
// }: LoginFormProps) {
//   const login = useGlobalStore((state: any) => state.login);
//   const [showTwoFactor, setShowTwoFactor] = useState(false);
//   const [twoFactorData, setTwoFactorData] = useState<
//     TwoFactorResponse["data"] | null
//   >(null);
//   const [loginCredentials, setLoginCredentials] =
//     useState<LoginFormValues | null>(null);
//   const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
//   // React Query mutation for login API
//   const loginMutation = useMutation({
//     mutationFn: isClient ? loginOrganizationApi : loginAdminApi,
//     onSuccess: (response, variables) => {
//       // Check if response has status code 206 (2FA required)
//       console.log(response);
//       if (response.data?.two_step_verification) {
//         console.log("here");
//         setTwoFactorData(response.data);
//         setLoginCredentials(variables);
//         setShowTwoFactor(true);
//         toast.success("Please complete two-factor authentication");
//         return;
//       } else if (!response.data.user.two_step_verification) {
//         // Show 2FA setup prompt
//         setShowTwoFactorSetup(true);
//       } else {
//         // Regular login success
//         toast.success("Welcome back user!");
//         login();
//         window.location.reload();
//       }
//     },
//     onError: (error: any) => {
//       if (error?.response?.status === 401) {
//         toast.error("Invalid credentials. Please try again!");
//       } else if (error?.response?.status === 423) {
//         toast.error("Account is locked. Please contact support.");
//       } else if (error?.response?.status === 429) {
//         toast.error("Too many login attempts. Please try again later.");
//       } else {
//         toast.error("Login failed. Please try again!");
//       }
//     },
//   });

//   const form = useForm<LoginFormValues>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       username: "",
//       password: "",
//     },
//   });

//   const onSubmit = (values: LoginFormValues) => {
//     loginMutation.mutate(values);
//   };

//   const handleTwoFactorSuccess = () => {
//     toast.success("Welcome back user!");
//     login();
//     window.location.reload();
//   };

//   const handleTwoFactorBack = () => {
//     setShowTwoFactor(false);
//     setTwoFactorData(null);
//     setLoginCredentials(null);
//   };

//   // Show 2FA verification component if required
//   if (showTwoFactor && twoFactorData) {
//     return (
//       <TwoFactorVerification
//         userId={twoFactorData.user_id}
//         onSuccess={handleTwoFactorSuccess}
//         onBack={handleTwoFactorBack}
//         username={loginCredentials?.username}
//       />
//     );
//   }

//   if(showTwoFactorSetup){

//   }

//   return (
//     <form
//       className="flex flex-col gap-6"
//       onSubmit={form.handleSubmit(onSubmit)}
//       {...props}
//     >
//       <div className="flex flex-col items-center gap-2 text-center">
//         <h1 className="text-2xl font-bold">Login to your account</h1>
//         <p className="text-balance text-sm text-muted-foreground">
//           Enter your email or phone below to login to your account.
//         </p>
//       </div>
//       <div className="grid gap-6">
//         <Form {...form}>
//           <FormField
//             control={form.control}
//             name="username"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Email</FormLabel>
//                 <FormControl>
//                   <Input placeholder="m@example.com" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="password"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Password</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="password"
//                     placeholder="Enter password"
//                     {...field}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </Form>
//         <Button
//           type="submit"
//           className="w-full"
//           disabled={loginMutation.isPending}
//         >
//           {loginMutation.isPending ? (
//             <>
//               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
//               Signing in...
//             </>
//           ) : (
//             "Login"
//           )}
//         </Button>
//         <div className="text-center text-sm opacity-0 cursor-none">
//           Don&apos;t have an account?{" "}
//           <span
//             className="underline underline-offset-4 cursor-pointer"
//             onClick={onSignupClick}
//           >
//             Sign up
//           </span>
//         </div>
//       </div>
//     </form>
//   );
// }

"use client";

import { loginAdminApi, loginOrganizationApi } from "@/api/auth/login";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useGlobalStore } from "@/hooks/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { TwoFactorVerification } from "./Two-Factor-Verification-Component";
import {
  EmailTwoFactorSetup,
  PhoneTwoFactorSetup,
  AuthenticatorTwoFactorSetup,
} from "./Two-Factor-Setup-Components";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Call02Icon,
  Mail01Icon,
  PhoneOff01Icon,
  Shield01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";

const formSchema = z.object({
  username: z
    .string({ required_error: "Email is required." })
    .min(4, { message: "Please enter a valid email or phonenumber." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." }),
});

interface LoginFormValues {
  username: string;
  password: string;
}

interface LoginFormProps extends React.ComponentPropsWithoutRef<"form"> {
  onSignupClick?: () => void;
  isAdmin: boolean;
  isClient: boolean;
}

interface TwoFactorResponse {
  success: boolean;
  data: {
    two_step_verification: boolean;
    user_id: string;
  };
  error: null;
}

interface LoginApiResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
      email_verified: boolean;
      phone_number: string | null;
      phone_number_verified: boolean;
      first_name: string;
      middle_name: string | null;
      last_name: string;
      full_name: string;
      two_step_verification: boolean;
      // ... other user properties
    };
  };
  error: null;
}

export function LoginForm({
  onSignupClick,
  isAdmin,
  isClient,
  ...props
}: LoginFormProps) {
  const login = useGlobalStore((state: any) => state.login);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<
    TwoFactorResponse["data"] | null
  >(null);
  const [loginCredentials, setLoginCredentials] =
    useState<LoginFormValues | null>(null);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorSetupType, setTwoFactorSetupType] = useState<
    "email" | "phone" | "authenticator" | null
  >(null);
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");

  // React Query mutation for login API
  const loginMutation = useMutation({
    mutationFn: isClient ? loginOrganizationApi : loginAdminApi,
    onSuccess: (response: LoginApiResponse, variables) => {
      console.log(response);

      // Check if user has 2FA enabled
      if (response.data?.user?.two_step_verification) {
        // User has 2FA enabled, show verification
        setTwoFactorData({
          two_step_verification: true,
          user_id: response.data.user.id,
        });
        setLoginCredentials(variables);
        setShowTwoFactor(true);
        toast.success("Please complete two-factor authentication");
        return;
      } else {
        // User doesn't have 2FA enabled, show setup prompt
        setUserEmail(response.data.user.email);
        setUserPhone(response.data.user.phone_number || "");
        setShowTwoFactorSetup(true);
        toast.success(
          "Login successful! Please setup two-factor authentication for better security."
        );
        return;
      }
    },
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        toast.error("Invalid credentials. Please try again!");
      } else if (error?.response?.status === 423) {
        toast.error("Account is locked. Please contact support.");
      } else if (error?.response?.status === 429) {
        toast.error("Too many login attempts. Please try again later.");
      } else {
        toast.error("Login failed. Please try again!");
      }
    },
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const handleTwoFactorSuccess = () => {
    toast.success("Welcome back user!");
    login();
    window.location.reload();
  };

  const handleTwoFactorBack = () => {
    setShowTwoFactor(false);
    setTwoFactorData(null);
    setLoginCredentials(null);
  };

  const handleTwoFactorSetupComplete = () => {
    toast.success("Two-factor authentication setup complete!");
    login();
    window.location.reload();
  };

  const handleTwoFactorSetupBack = () => {
    setShowTwoFactorSetup(false);
  };

  const handleSkipTwoFactorSetup = () => {
    toast.info(
      "You can setup two-factor authentication later from your account settings."
    );
    login();
    window.location.reload();
  };

  // Show 2FA verification component if required
  if (showTwoFactor && twoFactorData) {
    return (
      <TwoFactorVerification
        userId={twoFactorData.user_id}
        onSuccess={handleTwoFactorSuccess}
        onBack={handleTwoFactorBack}
        username={loginCredentials?.username}
      />
    );
  }

  if (showTwoFactorSetup && !twoFactorSetupType) {
    return (
      <div>
        <div>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                backgroundColor: "var(--primary)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <HugeiconsIcon icon={Shield01Icon} />
            </div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "var(--foreground)",
                marginBottom: "0.5rem",
              }}
            >
              Secure Your Account
            </h1>
            <p
              style={{
                color: "var(--surface-700)",
                fontSize: "0.875rem",
                lineHeight: "1.4",
              }}
            >
              Set up two-factor authentication to add an extra layer of security
              to your account.
            </p>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <button
              onClick={() => setTwoFactorSetupType("email")}
              style={{
                padding: "1rem",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                backgroundColor: "var(--background)",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                   const target = e.currentTarget as HTMLButtonElement;
                target.style.borderColor = "var(--primary)";
                target.style.backgroundColor = "var(--surface-100)";
              }}
              onMouseLeave={(e) => {
                   const target = e.currentTarget as HTMLButtonElement;
                target.style.borderColor = "var(--border)";
                target.style.backgroundColor = "var(--background)";
              }}
            >
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  backgroundColor: "var(--surface-200)",
                  borderRadius: "0.375rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HugeiconsIcon icon={Mail01Icon} />
              </div>
              <div>
                <h3
                  style={{
                    fontWeight: "600",
                    color: "var(--foreground)",
                    marginBottom: "0.25rem",
                  }}
                >
                  Email Authentication
                </h3>
                <p
                  style={{ fontSize: "0.875rem", color: "var(--surface-600)" }}
                >
                  Receive verification codes via email
                </p>
              </div>
            </button>

            <button
              onClick={() => setTwoFactorSetupType("phone")}
              style={{
                padding: "1rem",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                backgroundColor: "var(--background)",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.borderColor = "var(--primary)";
                target.style.backgroundColor = "var(--surface-100)";
              }}
              onMouseLeave={(e) => {
                   const target = e.currentTarget as HTMLButtonElement;
                target.style.borderColor = "var(--border)";
                target.style.backgroundColor = "var(--background)";
              }}
            >
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  backgroundColor: "var(--surface-200)",
                  borderRadius: "0.375rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HugeiconsIcon icon={Call02Icon} />
              </div>
              <div>
                <h3
                  style={{
                    fontWeight: "600",
                    color: "var(--foreground)",
                    marginBottom: "0.25rem",
                  }}
                >
                  SMS Authentication
                </h3>
                <p
                  style={{ fontSize: "0.875rem", color: "var(--surface-600)" }}
                >
                  Receive verification codes via text message
                </p>
              </div>
            </button>

            <button
              onClick={() => setTwoFactorSetupType("authenticator")}
              style={{
                padding: "1rem",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                backgroundColor: "var(--background)",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.borderColor = "var(--primary)";
                target.style.backgroundColor = "var(--surface-100)";
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.borderColor = "var(--border)";
                target.style.backgroundColor = "var(--background)";
              }}
            >
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  backgroundColor: "var(--surface-200)",
                  borderRadius: "0.375rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HugeiconsIcon icon={SmartPhone01Icon} />
              </div>
              <div>
                <h3
                  style={{
                    fontWeight: "600",
                    color: "var(--foreground)",
                    marginBottom: "0.25rem",
                  }}
                >
                  Authenticator App
                </h3>
                <p
                  style={{ fontSize: "0.875rem", color: "var(--surface-600)" }}
                >
                  Use Google Authenticator or similar apps
                </p>
              </div>
            </button>
          </div>

          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <button
              onClick={handleSkipTwoFactorSetup}
              style={{
                color: "var(--surface-600)",
                fontSize: "0.875rem",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show specific 2FA setup component
  if (showTwoFactorSetup && twoFactorSetupType === "email") {
    return (
      <EmailTwoFactorSetup
        userEmail={userEmail}
        onBack={() => setTwoFactorSetupType(null)}
        onComplete={handleTwoFactorSetupComplete}
      />
    );
  }

  if (showTwoFactorSetup && twoFactorSetupType === "phone") {
    return (
      <PhoneTwoFactorSetup
        userPhone={userPhone}
        onBack={() => setTwoFactorSetupType(null)}
        onComplete={handleTwoFactorSetupComplete}
      />
    );
  }

  if (showTwoFactorSetup && twoFactorSetupType === "authenticator") {
    return (
      <AuthenticatorTwoFactorSetup
        userEmail={userEmail}
        onBack={() => setTwoFactorSetupType(null)}
        onComplete={handleTwoFactorSetupComplete}
      />
    );
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email or phone below to login to your account.
        </p>
      </div>
      <div className="grid gap-6">
        <Form {...form}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="m@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            "Login"
          )}
        </Button>
        <div className="text-center text-sm opacity-0 cursor-none">
          Don&apos;t have an account?{" "}
          <span
            className="underline underline-offset-4 cursor-pointer"
            onClick={onSignupClick}
          >
            Sign up
          </span>
        </div>
      </div>
    </form>
  );
}
