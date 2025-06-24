"use client";

import React, { useState } from 'react';
import { 
  Settings01Icon, 
  UserIcon, 
  ArrowRight01Icon,
  InformationCircleIcon,
  CancelCircleIcon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from '@hugeicons/react';

interface TwoFactorSetupPromptProps {
  onSkip?: () => void;
  onSetupEmail?: () => void;
  onSetupPhone?: () => void;
  onSetupAuthenticator?: () => void;
  userEmail?: string;
  userPhone?: string;
}

export const TwoFactorSetupPrompt = ({ 
  onSkip, 
  onSetupEmail, 
  onSetupPhone, 
  onSetupAuthenticator,
  userEmail = "sunbi.devops@gmail.com",
  userPhone 
}: TwoFactorSetupPromptProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const setupMethods = [
    {
      id: 'email',
      title: 'Email Verification',
      description: 'Receive verification codes via email',
      detail: userEmail ? `Send codes to ${userEmail}` : 'Send codes to your registered email',
      icon: '📧',
      available: true,
      recommended: false,
      onClick: onSetupEmail
    },
    {
      id: 'phone',
      title: 'SMS Verification',
      description: 'Receive verification codes via text message',
      detail: userPhone ? `Send codes to ${userPhone}` : 'Add phone number to receive SMS codes',
      icon: '📱',
      available: !!userPhone,
      recommended: false,
      onClick: onSetupPhone
    },
    {
      id: 'authenticator',
      title: 'Authenticator App',
      description: 'Use Google Authenticator, Authy, or similar apps',
      detail: 'Most secure option with offline access',
      icon: '🔐',
      available: true,
      recommended: true,
      onClick: onSetupAuthenticator
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: 'var(--background)'}}>
      {/* Background overlay */}
      <div className="fixed inset-0" style={{backgroundColor: 'var(--surface-900)', opacity: '0.5'}}></div>
      
      {/* Main modal */}
      <div className="relative w-full max-w-2xl mx-auto">
        <div 
          className="rounded-2xl p-8 shadow-lg border"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--primary)'}}>
              <HugeiconsIcon icon={Settings01Icon} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{color: 'var(--foreground)'}}>
              Secure Your Account
            </h1>
            <p className="text-sm" style={{color: 'var(--surface-600)'}}>
              Set up two-factor authentication to add an extra layer of security to your account
            </p>
          </div>

          {/* Security notice */}
          <div 
            className="flex items-start gap-3 p-4 rounded-xl mb-6 border"
            style={{
              backgroundColor: 'var(--surface-100)',
              borderColor: 'var(--primary)'
            }}
          >
            <HugeiconsIcon icon={InformationCircleIcon} />
            <div>
              <h3 className="font-medium text-sm mb-1" style={{color: 'var(--foreground)'}}>
                Why enable 2FA?
              </h3>
              <p className="text-xs" style={{color: 'var(--surface-600)'}}>
                Two-factor authentication significantly reduces the risk of unauthorized access, 
                even if your password is compromised.
              </p>
            </div>
          </div>

          {/* Setup methods */}
          <div className="space-y-3 mb-8">
            {setupMethods.map((method) => (
              <div key={method.id}>
                <button
                  onClick={() => {
                    if (method.available && method.onClick) {
                      setSelectedMethod(method.id);
                      method.onClick();
                    }
                  }}
                  disabled={!method.available}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    method.available 
                      ? 'hover:scale-[1.02] cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed'
                  } ${
                    selectedMethod === method.id 
                      ? 'border-[var(--primary)] bg-[var(--surface-100)]' 
                      : 'border-[var(--border)] hover:border-[var(--surface-400)]'
                  }`}
                  style={{
                    backgroundColor: selectedMethod === method.id ? 'var(--surface-100)' : 'var(--background)',
                    borderColor: selectedMethod === method.id ? 'var(--primary)' : 'var(--border)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{method.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base" style={{color: 'var(--foreground)'}}>
                            {method.title}
                          </h3>
                          {method.recommended && (
                            <span 
                              className="text-xs px-2 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: 'var(--success)',
                                color: 'white'
                              }}
                            >
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-1" style={{color: 'var(--surface-600)'}}>
                          {method.description}
                        </p>
                        <p className="text-xs" style={{color: 'var(--surface-500)'}}>
                          {method.detail}
                        </p>
                      </div>
                    </div>
                    {method.available && (
                        <HugeiconsIcon icon={ArrowRight01Icon} />
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 py-3 px-6 rounded-xl border font-medium transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--surface-600)',
                backgroundColor: 'var(--background)'
              }}
            >
              Skip for now
            </button>
            <button
              onClick={() => {
                // If no method selected, default to authenticator (recommended)
                if (onSetupAuthenticator) {
                  onSetupAuthenticator();
                }
              }}
              className="flex-1 py-3 px-6 rounded-xl font-medium text-white transition-colors hover:opacity-90"
              style={{backgroundColor: 'var(--primary)'}}
            >
              Set up 2FA
            </button>
          </div>

          {/* Skip warning */}
          <div className="mt-4 text-center">
            <p className="text-xs" style={{color: 'var(--surface-500)'}}>
              You can always enable 2FA later in your account settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
