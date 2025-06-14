"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Shield, ArrowLeft, Smartphone } from "lucide-react";
import { crAxios } from "@/api"; // Adjust import path as needed

// API function for authenticator login
export const loginUsingAuthenticator = async({code, userId}:{code:string, userId: string}) => {
  const { data } = await crAxios.post("/api/v1/authenticator/login", {
    "user_id":userId,
    code,
  });
  return data;
};

const verificationSchema = z.object({
  code: z
    .string()
    .length(6, { message: "Verification code must be 6 digits" })
    .regex(/^\d+$/, { message: "Code must contain only numbers" }),
});

interface VerificationFormValues {
  code: string;
}

interface TwoFactorVerificationProps {
  userId: string;
  username?: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function TwoFactorVerification({ 
  userId, 
  username, 
  onSuccess, 
  onBack 
}: TwoFactorVerificationProps) {
  
  // React Query mutation for 2FA verification
  const verifyMutation = useMutation({
    mutationFn: loginUsingAuthenticator,
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Authentication successful!");
        onSuccess();
      } else {
        toast.error(response.error || "Authentication failed");
      }
    },
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        toast.error("Invalid authentication code. Please try again.");
      } else if (error?.response?.status === 429) {
        toast.error("Too many attempts. Please wait before trying again.");
      } else {
        toast.error("Authentication failed. Please try again.");
      }
    },
  });

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = (values: VerificationFormValues) => {
    verifyMutation.mutate({ code: values.code, userId: userId });
  };

  const handleCodeChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    form.setValue('code', numericValue);
    
    // Auto-submit when 6 digits are entered
    if (numericValue.length === 6) {
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter the 6-digit code from your authenticator app
          </p>
          {username && (
            <p className="text-xs text-muted-foreground mt-1">
              Signing in as: <span className="font-medium">{username}</span>
            </p>
          )}
        </div>
      </div>

      {/* Verification Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-center block">Authentication Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    className="text-center text-2xl font-mono tracking-widest h-14"
                    maxLength={6}
                    autoComplete="off"
                    onChange={(e) => handleCodeChange(e.target.value)}
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <Button 
              type="submit" 
              className="w-full h-12"
              disabled={verifyMutation.isPending || form.watch('code').length !== 6}
            >
              {verifyMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Verify & Continue
                </>
              )}
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              className="w-full"
              onClick={onBack}
              disabled={verifyMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </form>
      </Form>

      {/* Help Section */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Smartphone className="w-4 h-4" />
          Need help?
        </div>
        <div className="text-xs text-muted-foreground space-y-2">
          <p>• Open your authenticator app (Google Authenticator, Authy, etc.)</p>
          <p>• Find the 6-digit code for this account</p>
          <p>• Enter the code above - it refreshes every 30 seconds</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="text-xs text-muted-foreground text-center">
        <p>This helps keep your account secure. The code expires in 30 seconds.</p>
      </div>
    </div>
  );
}