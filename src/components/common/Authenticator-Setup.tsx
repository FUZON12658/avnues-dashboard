"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Smartphone, QrCode, Key, CheckCircle, AlertCircle, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { crAxios } from '@/api';
import { deleteAuthenticator, getAuthenticators, startAuthenticatorVerification, verifyAuthentication } from '@/api/auth/misc';



const AuthenticatorSetup = () => {
  const [setupStep, setSetupStep] = useState('initial'); // initial, qr, verify, complete
  const [currentSetup, setCurrentSetup] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    deviceName: '',
    verificationCode: ''
  });
  const [showSecret, setShowSecret] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const queryClient = useQueryClient();

  // Query for existing authenticators
  const { data: authenticators = [], isLoading: loadingAuthenticators } = useQuery({
    queryKey: ['authenticators'],
    queryFn: getAuthenticators,
  });

  // Mutation for starting authenticator setup
  const setupMutation = useMutation({
    mutationFn: startAuthenticatorVerification,
    onSuccess: (data) => {
      if (data.success) {
        setCurrentSetup(data.data);
        setSetupStep('qr');
      }
    },
    onError: (error) => {
      console.error('Setup failed:', error);
    }
  });

  // Mutation for verifying authenticator
  const verifyMutation = useMutation({
    mutationFn: verifyAuthentication,
    onSuccess: (data) => {
      if (data.success && data.data.valid) {
        setSetupStep('complete');
        // Refetch authenticators list
        queryClient.invalidateQueries({ queryKey: ['authenticators'] });
        
        // Reset form after delay
        setTimeout(() => {
          resetSetup();
        }, 2000);
      }
    },
    onError: (error) => {
      console.error('Verification failed:', error);
    }
  });

  // Mutation for deleting authenticator
  const deleteMutation = useMutation({
    mutationFn: deleteAuthenticator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authenticators'] });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
    }
  });

  const handleStartSetup = (e:any) => {
    e.preventDefault();
    if (!formData.deviceName.trim()) {
      return;
    }
    setupMutation.mutate({
      device_name: formData.deviceName,
      username: formData.username
    });
  };

  const handleVerifyCode = (e:any) => {
    e.preventDefault();
    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      return;
    }
    verifyMutation.mutate({ code: formData.verificationCode });
  };

  const resetSetup = () => {
    setCurrentSetup(null);
    setSetupStep('initial');
    setFormData(prev => ({ ...prev, deviceName: '', verificationCode: '' }));
    setShowSecret(false);
    setCopySuccess(false);
  };

  const extractSecretFromUri = (uri:any) => {
    const match = uri.match(/secret=([A-Z0-9]+)/);
    return match ? match[1] : '';
  };

  const copyToClipboard = async (text:any) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatSecret = (secret:any) => {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Two-Factor Authentication</h1>
          </div>
          <p className="text-gray-600">Secure your account with authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Setup Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add New Authenticator
            </h2>

            {/* Error Messages */}
            {(setupMutation.error || verifyMutation.error) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                {setupMutation.error?.message || verifyMutation.error?.message || 'An error occurred'}
              </div>
            )}

            {/* Success Message */}
            {setupStep === 'complete' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                Authenticator added successfully!
              </div>
            )}

            {/* Invalid code message */}
            {verifyMutation.data?.success && !verifyMutation.data?.data?.valid && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                {verifyMutation.data.data.message || 'Invalid verification code'}
              </div>
            )}

            {/* Initial Setup Form */}
            {setupStep === 'initial' && (
              <form onSubmit={handleStartSetup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    value={formData.deviceName}
                    onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                    placeholder="e.g., John's iPhone, Work Laptop, Personal Phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Give your device a memorable name to identify it later</p>
                </div>

                <button
                  type="submit"
                  disabled={setupMutation.isPending || !formData.deviceName.trim()}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                >
                  {setupMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </button>
              </form>
            )}

            {/* QR Code Display */}
            {setupStep === 'qr' && currentSetup && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Step 1: Scan QR Code</h3>
                  <p className="text-sm text-gray-600 mb-4">Open your authenticator app and scan this QR code</p>
                  
                  <div className="flex justify-center mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
                      <QRCodeSVG 
                        value={currentSetup.qr_code_uri}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-3 font-medium">Can't scan? Enter this key manually:</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded border text-center tracking-wider">
                        {showSecret 
                          ? formatSecret(extractSecretFromUri(currentSetup.qr_code_uri))
                          : '••••••••••••••••••••••••••••••••'
                        }
                      </code>
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title={showSecret ? "Hide secret" : "Show secret"}
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(extractSecretFromUri(currentSetup.qr_code_uri))}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Copy secret key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    {copySuccess && (
                      <p className="text-xs text-green-600 mt-2">Secret copied to clipboard!</p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Step 2: Enter Verification Code</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    After adding to your authenticator app, enter the 6-digit code it generates:
                  </p>
                  
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <input
                      type="text"
                      value={formData.verificationCode}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) 
                      }))}
                      placeholder="000000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-xl font-mono tracking-widest"
                      maxLength={6}
                      autoComplete="off"
                      required
                    />
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={resetSetup}
                        className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={verifyMutation.isPending || formData.verificationCode.length !== 6}
                        className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                      >
                        {verifyMutation.isPending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Verify & Complete
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Setup Instructions */}
            {setupStep === 'initial' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Enter a name for your device</li>
                  <li>2. Scan the QR code with your authenticator app</li>
                  <li>3. Enter the 6-digit code to verify setup</li>
                  <li>4. Your authenticator is ready to use!</li>
                </ol>
              </div>
            )}
          </div>

          {/* Existing Authenticators Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Your Authenticators
            </h2>

            {loadingAuthenticators ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading authenticators...</p>
              </div>
            ) : authenticators.length === 0 ? (
              <div className="text-center py-12">
                <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No authenticators yet</h3>
                <p className="text-gray-400">Add your first authenticator to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {authenticators.data.devices.map((auth:any) => (
                  <div key={auth.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{auth.device_name}</h4>
                        <p className="text-sm text-gray-500">
                          Added {new Date(auth.date_created).toLocaleDateString()}
                        </p>
                        {auth.is_active && (
                          <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full mt-1">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    {/* <button
                      onClick={() => deleteMutation.mutate(auth.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove authenticator"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button> */}
                  </div>
                ))}
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">Security Notice</h4>
                  <p className="text-sm text-amber-700">
                    Keep your authenticator app secure and backed up. If you lose access to your device, 
                    you may need to contact support to regain access to your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Authenticator Apps */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommended Authenticator Apps</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Google Authenticator', desc: 'Simple and reliable' },
              { name: 'Microsoft Authenticator', desc: 'Feature-rich with backup' },
              { name: 'Authy', desc: 'Multi-device sync' },
              { name: '1Password', desc: 'Password manager integration' }
            ].map((app) => (
              <div key={app.name} className="p-4 border border-gray-200 rounded-lg text-center">
                <h4 className="font-medium text-gray-800 mb-1">{app.name}</h4>
                <p className="text-sm text-gray-500">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticatorSetup;