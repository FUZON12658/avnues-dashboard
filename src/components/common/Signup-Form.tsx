
'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signupApi} from '@/api/auth/signup';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '@/components/ui/form';
import { toast, Toaster } from 'sonner';
import zxcvbn from 'zxcvbn';

interface SignupFormProps extends React.ComponentPropsWithoutRef<'form'> {
  onSignupClick?: () => void; // Optional prop for handling signup clicks
}

// Password strength labels
const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

// Password criteria
const passwordSuggestions = [
  'At least 9 characters',
  'Include both lowercase and uppercase letters',
  'Include special characters or numbers',
];

// Signup form validation schema with Zod
const formSchema = z
  .object({
    firstName: z.string({ required_error: 'First Name is required' }).min(1, { message: 'First Name must be at least 3 character' }),
    lastName: z.string({ required_error: 'Last Name is required' }).min(1, { message: 'Last Name must be at least 3 character' }),
    username: z
      .string({ required_error: 'Email or phone number is required.' })
      .refine(
        (val) => {
          const isEmail =
            /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i.test(
              val
            );
          const isPhone = /^[0-9]{10}$/.test(val);
          return isEmail || isPhone;
        },
        { message: 'Please enter a valid email or phone number.' }
      ),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .refine(
        async (val) => {
          const result = zxcvbn(val);
          const lengthReq = val.length >= 9;
          const caseReq = /[a-z]/.test(val) && /[A-Z]/.test(val);
          const specialCharReq = /[!@#$%^&*(),.?":{}|<>0-9]/.test(val);

          const isCriteriaMet =
            lengthReq && caseReq && specialCharReq && result.score >= 3;
          return isCriteriaMet;
        },
        { message: 'Password is too weak.' }
      ),
    confirmPassword: z.string({
      required_error: 'Confirm Password is required.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export function SignupForm({
  className,
  onSignupClick,
  ...props
}: SignupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const signupMutation = useMutation({
    mutationFn: signupApi,
    onSuccess: () => {
      setIsSubmitting(false);
      form.reset();
      toast.success("Signup successful")
    },
    onError: () => {
      setIsSubmitting(false);
      toast.error("An error occurred when signing up")
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    signupMutation.mutate(values)


  };

  const googleMutation = () => {
    router.push(`${process.env.NEXT_PUBLIC_INHOUSE_API}/api/auth/google`);
  };

  const facebookMutation = () => {
    router.push(`${process.env.NEXT_PUBLIC_INHOUSE_API}/api/auth/facebook`);
  };

  return (
    <Form {...form}>
      <form
        className={className}
        onSubmit={form.handleSubmit(onSubmit)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Register New Account</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Enter your email below to register your account
          </p>
        </div>
        <div className="grid gap-3 mt-5">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="First Name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Last Name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Email or Phone" />
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
                <FormControl>
                  <Input {...field} type="password" placeholder="Password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Confirm Password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting || signupMutation.isPending
            }
          >
            {isSubmitting ||
            signupMutation.isPending ? (
              <LoaderCircle
                className="absolute w-6 h-6 animate-spin text-white"
                aria-label="Loading"
              />
            ) : (
              'Sign Up'
            )}
          </Button>
          {/* <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              router.push(
                `${process.env.NEXT_PUBLIC_INHOUSE_API}/api/auth/google`
              )
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Login with Google
          </Button> */}
        </div>
        <div className="text-center text-sm cursor-pointer mt-5">
          Already have an account?{' '}
          <div
            onClick={onSignupClick}
            className="underline underline-offset-4 inline"
          >
            Login
          </div>
        </div>
      </form>
    </Form>
  );
}
