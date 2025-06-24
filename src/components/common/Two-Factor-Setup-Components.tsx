"use client";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  Settings01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  MailIcon,
  SmartPhone01Icon,
  SecurityIcon,
  Call02Icon,
  Copy01Icon,
  EyeFreeIcons,
  ViewOffIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { IconInput, Input } from "../ui/input";
import {
  getAuthenticators,
  startAuthenticatorVerification,
  verifyAuthentication,
} from "@/api/auth/misc";

type EmailTwoFactorProps = {
  userEmail?: string;
  onBack: () => void;
  onComplete: () => void;
};

export const EmailTwoFactorSetup = ({
  userEmail: initialEmail = "",
  onBack,
  onComplete,
}: EmailTwoFactorProps) => {
  const [step, setStep] = React.useState<"send" | "verify" | "complete">(
    "send"
  );
  const [otp, setOtp] = React.useState("");
  const [email, setEmail] = React.useState(initialEmail);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [resendTimer, setResendTimer] = React.useState(0);

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = () => {
    const targetEmail = email.trim();

    if (!targetEmail) {
      setError("Email address is required");
      return;
    }

    setIsLoading(true);
    setError("");
    setTimeout(() => {
      setStep("verify");
      setIsLoading(false);
      setResendTimer(60);
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      setError("Enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");
    setTimeout(() => {
      if (otp === "123456") {
        setStep("complete");
        setIsLoading(false);
        setTimeout(() => onComplete?.(), 1000);
      } else {
        setError("Incorrect verification code");
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    setError("");
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
        Back
      </button>

      {step === "send" && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "var(--primary)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HugeiconsIcon icon={MailIcon} className="text-white" />
          </div>

          <h2 className="text-xl font-semibold mb-1">
            Setup Email Verification
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            To protect your account, we’ll send a one-time code to your email.
          </p>

          {error && (
            <p className="text-sm text-red-500 mb-4 flex items-center justify-center gap-1">
              <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
              {error}
            </p>
          )}

          {initialEmail ? (
            <IconInput
              icon={MailIcon}
              inputProps={{
                value: email,
                disabled: true,
                type: "email",
              }}
              containerClassName="mb-4"
              className="opacity-60 cursor-not-allowed"
              iconClassName="text-gray-400"
            />
          ) : (
            <IconInput
              icon={MailIcon}
              inputProps={{
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: "Enter your email",
                type: "email",
              }}
              containerClassName="mb-4"
            />
          )}

          <button
            onClick={handleSendOtp}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isLoading ? "Sending..." : "Send Verification Code"}
          </button>
        </div>
      )}

      {step === "verify" && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "var(--primary)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HugeiconsIcon icon={MailIcon} />
          </div>

          <h2 className="text-xl font-semibold mb-1">Enter the Code</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          {error && (
            <p className="text-sm text-red-500 mb-4 flex items-center justify-center gap-1">
              <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
              {error}
            </p>
          )}

          <Input
            placeholder="000000"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            maxLength={6}
            className="text-center text-lg tracking-widest mb-4"
          />

          <button
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.length !== 6}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>

          <button
            onClick={handleResendOtp}
            disabled={resendTimer > 0}
            className="text-sm text-primary mt-3 disabled:opacity-50"
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
          </button>
        </div>
      )}

      {step === "complete" && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "var(--primary)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} />
          </div>

          <h2 className="text-xl font-semibold mb-1">Email Verified!</h2>
          <p className="text-sm text-muted-foreground">
            Email-based two-factor authentication has been successfully enabled.
          </p>
        </div>
      )}
    </div>
  );
};

type PhoneTwoFactorProps = {
  userPhone?: string;
  onBack: () => void;
  onComplete: () => void;
};

export const PhoneTwoFactorSetup = ({
  userPhone: initialPhone = "",
  onBack,
  onComplete,
}: PhoneTwoFactorProps) => {
  const [step, setStep] = React.useState<"send" | "verify" | "complete">(
    "send"
  );
  const [otp, setOtp] = React.useState("");
  const [phone, setPhone] = React.useState(initialPhone);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [resendTimer, setResendTimer] = React.useState(0);

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = () => {
    const targetPhone = phone.trim();

    if (!targetPhone) {
      setError("Phone number is required");
      return;
    }

    setIsLoading(true);
    setError("");
    setTimeout(() => {
      setStep("verify");
      setIsLoading(false);
      setResendTimer(60);
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      setError("Enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");
    setTimeout(() => {
      if (otp === "123456") {
        setStep("complete");
        setIsLoading(false);
        setTimeout(() => onComplete?.(), 1000);
      } else {
        setError("Incorrect verification code");
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    setError("");
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
        Back
      </button>

      {step === "send" && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "var(--primary)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HugeiconsIcon icon={Call02Icon} className="text-white" />
          </div>

          <h2 className="text-xl font-semibold mb-1">Setup SMS Verification</h2>
          <p className="text-sm text-muted-foreground mb-6">
            To protect your account, we’ll send a one-time code via SMS.
          </p>

          {error && (
            <p className="text-sm text-red-500 mb-4 flex items-center justify-center gap-1">
              <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
              {error}
            </p>
          )}

          {initialPhone ? (
            <IconInput
              icon={Call02Icon}
              inputProps={{
                value: phone,
                disabled: true,
                type: "tel",
              }}
              containerClassName="mb-4"
              className="opacity-60 cursor-not-allowed"
              iconClassName="text-gray-400"
            />
          ) : (
            <IconInput
              icon={Call02Icon}
              inputProps={{
                value: phone,
                onChange: (e) => setPhone(e.target.value),
                placeholder: "Enter your phone number",
                type: "tel",
              }}
              containerClassName="mb-4"
            />
          )}

          <button
            onClick={handleSendOtp}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isLoading ? "Sending..." : "Send Verification Code"}
          </button>
        </div>
      )}

      {step === "verify" && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "var(--primary)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HugeiconsIcon icon={SmartPhone01Icon} className="text-white" />
          </div>

          <h2 className="text-xl font-semibold mb-1">Enter the Code</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a 6-digit code to <strong>{phone}</strong>
          </p>

          {error && (
            <p className="text-sm text-red-500 mb-4 flex items-center justify-center gap-1">
              <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
              {error}
            </p>
          )}

          <Input
            placeholder="000000"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            maxLength={6}
            className="text-center text-lg tracking-widest mb-4"
          />

          <button
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.length !== 6}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>

          <button
            onClick={handleResendOtp}
            disabled={resendTimer > 0}
            className="text-sm text-primary mt-3 disabled:opacity-50"
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
          </button>
        </div>
      )}

      {step === "complete" && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "var(--primary)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} />
          </div>

          <h2 className="text-xl font-semibold mb-1">Phone Verified!</h2>
          <p className="text-sm text-muted-foreground">
            SMS-based two-factor authentication has been successfully enabled.
          </p>
        </div>
      )}
    </div>
  );
};
// Authenticator Setup Component (Full Functionality)
type AuthenticatorTwoFactorSetupProps = {
  userEmail?: string;
  onBack: () => void;
  onComplete: () => void;
};

export const AuthenticatorTwoFactorSetup = ({
  userEmail = "",
  onBack,
  onComplete,
}: AuthenticatorTwoFactorSetupProps) => {
  const [step, setStep] = React.useState<
    "setup" | "qr" | "verify" | "complete"
  >("setup");
  const [deviceName, setDeviceName] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [currentSetup, setCurrentSetup] = React.useState<any>(null);
  const [showSecret, setShowSecret] = React.useState(false);
  const [copySuccess, setCopySuccess] = React.useState(false);

  const queryClient = useQueryClient();

  // Mutation for starting authenticator setup
  const setupMutation = useMutation({
    mutationFn: startAuthenticatorVerification,
    onSuccess: (data) => {
      if (data.success) {
        setCurrentSetup(data.data);
        setStep("qr");
        setIsLoading(false);
      }
    },
    onError: (error: any) => {
      setError(error?.message || "Setup failed. Please try again.");
      setIsLoading(false);
    },
  });

  // Mutation for verifying authenticator
  const verifyMutation = useMutation({
    mutationFn: verifyAuthentication,
    onSuccess: (data) => {
      if (data.success) {
        setStep("complete");
        setIsLoading(false);
        // Refetch authenticators list
        queryClient.invalidateQueries({ queryKey: ["authenticators"] });
        setTimeout(() => onComplete?.(), 2000);
      } else {
        setError(
          data.data?.message || "Invalid verification code. Please try again."
        );
        setIsLoading(false);
      }
    },
    onError: (error: any) => {
      setError(error?.message || "Verification failed. Please try again.");
      setIsLoading(false);
    },
  });

  const handleStartSetup = () => {
    if (!deviceName.trim()) {
      setError("Please enter a device name");
      return;
    }

    setIsLoading(true);
    setError("");

    setupMutation.mutate({
      device_name: deviceName,
      username: userEmail,
    });
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    verifyMutation.mutate({ code: verificationCode });
  };

  const extractSecretFromUri = (uri: string) => {
    const match = uri.match(/secret=([A-Z0-9]+)/);
    return match ? match[1] : "";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatSecret = (secret: string) => {
    return secret.match(/.{1,4}/g)?.join(" ") || secret;
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
        Back
      </button>

      {/* SETUP Step */}
      {step === "setup" && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "var(--primary)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HugeiconsIcon icon={SecurityIcon} className="text-white" />
          </div>

          <h2 className="text-xl font-semibold mb-1">
            Setup Authenticator App
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Use apps like Google Authenticator, Authy, or Microsoft
            Authenticator
          </p>

          {error && (
            <p className="text-sm text-red-500 mb-4 flex items-center justify-center gap-1">
              <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
              {error}
            </p>
          )}

          <div className="mb-4">
            <IconInput
              icon={SecurityIcon}
              inputProps={{
                value: deviceName,
                onChange: (e) => setDeviceName(e.target.value),
                placeholder: "e.g., John's iPhone, Work Laptop",
                type: "text",
              }}
              containerClassName="mb-2"
            />
            <p className="text-xs text-muted-foreground text-left">
              Give your device a memorable name to identify it later
            </p>
          </div>

          <div className="mb-6 p-4 bg-muted rounded-lg text-left">
            <h4 className="font-medium mb-2">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Enter a name for your device</li>
              <li>2. Scan the QR code with your authenticator app</li>
              <li>3. Enter the 6-digit code to verify setup</li>
              <li>4. Your authenticator is ready to use!</li>
            </ol>
          </div>

          <button
            onClick={handleStartSetup}
            disabled={isLoading || !deviceName.trim()}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isLoading ? "Setting up..." : "Generate QR Code"}
          </button>
        </div>
      )}

      {/* QR Step */}
      {step === "qr" && currentSetup && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "var(--primary)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HugeiconsIcon icon={SmartPhone01Icon} className="text-white" />
          </div>

          <h2 className="text-xl font-semibold mb-1">Scan QR Code</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Open your authenticator app and scan this QR code
          </p>

          {/* Container to hold QR and verification side by side */}
          <div className="flex flex-col md:flex-row md:justify-center md:items-start gap-6 mb-6">
            {/* QR Code Section */}
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-border mx-auto">
              <QRCodeSVG
                value={currentSetup.qr_code_uri}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>

            {/* Secret Key + Code Entry */}
            <div className="p-4 rounded-lg border bg-muted text-left min-w-full md:w-[320px] md:min-w-[320px]">
              <p className="text-sm font-medium mb-3">
                Can't scan? Enter this key manually:
              </p>
              <div className="flex items-center space-x-2 mb-4">
                <code className="flex-1 text-sm font-mono bg-background px-3 py-2 rounded border text-center tracking-wider">
                  {showSecret
                    ? formatSecret(
                        extractSecretFromUri(currentSetup.qr_code_uri)
                      )
                    : "••••••••••••••••••••••••••••••••"}
                </code>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-2 rounded hover:bg-muted-foreground/10 transition-colors"
                  title={showSecret ? "Hide secret" : "Show secret"}
                >
                  <HugeiconsIcon
                    icon={showSecret ? ViewIcon : ViewOffIcon}
                    className="w-4 h-4"
                  />
                </button>
                <button
                  onClick={() =>
                    copyToClipboard(
                      extractSecretFromUri(currentSetup.qr_code_uri)
                    )
                  }
                  className="p-2 rounded hover:bg-muted-foreground/10 transition-colors"
                  title="Copy secret key"
                >
                  <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
                </button>
              </div>

              {copySuccess && (
                <p className="text-xs text-green-600 mb-4">
                  Secret copied to clipboard!
                </p>
              )}

              <h3 className="text-lg font-medium mb-2">
                Enter Verification Code
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                After adding to your authenticator app, enter the 6-digit code:
              </p>

              {error && (
                <p className="text-sm text-red-500 mb-2 flex items-center gap-1">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    className="w-4 h-4"
                  />
                  {error}
                </p>
              )}

              <Input
                placeholder="000000"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                maxLength={6}
                className="text-center text-lg tracking-widest mb-4"
              />

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep("setup")}
                  className="flex-1 py-3 px-4 rounded-lg font-medium border border-border text-muted-foreground bg-background transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={isLoading || verificationCode.length !== 6}
                  style={{
                    background: "var(--primary)",
                    color: "#fff",
                  }}
                  className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE Step */}
      {step === "complete" && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "var(--primary)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              className="text-white"
            />
          </div>

          <h2 className="text-xl font-semibold mb-1">
            Authenticator App Setup Complete!
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your authenticator app &quot;{deviceName}&quot; is now active and
            ready to use
          </p>

          <div className="p-4 rounded-lg border bg-muted text-left">
            <h4 className="font-medium mb-2">Next Steps:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • Your authenticator app will generate new codes every 30
                seconds
              </li>
              <li>• Use these codes along with your password to sign in</li>
              <li>• Keep your device secure and backed up</li>
              <li>• You can add multiple devices for backup access</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
