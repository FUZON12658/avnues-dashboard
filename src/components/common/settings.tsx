"use client"
import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  Settings02Icon,
  Home01Icon,
  EyeIcon,
  InformationCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  Edit02Icon,
  FilterIcon,
  Calendar01Icon,
  File01Icon,
  GridViewIcon,
  MenuIcon,
  Search01Icon,
  Delete01Icon,
  Share08Icon,
  Download01Icon,
  Upload01Icon,
  Move01Icon,
  Copy01Icon,
  SortByDown01Icon,
  SortByUp01Icon,
  Add01Icon,
  FolderIcon,
  FileIcon,
  MoreHorizontalIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  UserIcon,
  LockIcon,
  Logout01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from '@/hooks/useTheme';

// Types
type ThemeType = 'light' | 'dark' | 'system';
type LanguageType = 'english' | 'nepali' | 'hindi' | 'spanish';
type VisibilityType = 'public' | 'friends' | 'private';
type ActivityType = 'everyone' | 'friends' | 'nobody';
type UpdateChannelType = 'stable' | 'beta' | 'alpha';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  browser: boolean;
}

interface PrivacySettings {
  profile: VisibilityType;
  activity: ActivityType;
  search: boolean;
}

interface PreferenceSettings {
  autoSave: boolean;
  compression: boolean;
  analytics: boolean;
  updates: UpdateChannelType;
}

interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  company: string;
  avatar: string;
  joinDate: string;
}

interface ThemeContextType {
  theme: ThemeType;
  systemTheme: 'light' | 'dark';
  actualTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

interface SelectOption {
  value: string;
  label: string;
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon: any;
}

interface SettingCardProps {
  title: string;
  description: string;
  icon: any;
  children: React.ReactNode;
}

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  type?: string;
}

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
}





// UI Components
const Input: React.FC<InputProps> = ({ 
  value, 
  onChange, 
  placeholder = "", 
  label,
  type = "text" 
}) => (
  <div className="space-y-2">
    {label && (
      <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      style={{
        backgroundColor: 'var(--surface-100)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)'
      }}
    />
  </div>
);

const Textarea: React.FC<TextareaProps> = ({ 
  value, 
  onChange, 
  placeholder = "", 
  label,
  rows = 4 
}) => (
  <div className="space-y-2">
    {label && (
      <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label}
      </label>
    )}
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      style={{
        backgroundColor: 'var(--surface-100)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)'
      }}
    />
  </div>
);

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm" style={{ color: 'var(--surface-700)' }}>{label}</span>
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, options, icon }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
      <HugeiconsIcon icon={icon} className="w-4 h-4" />
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      style={{
        backgroundColor: 'var(--surface-100)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)'
      }}
    >
      {options.map((option: SelectOption) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const SettingCard: React.FC<SettingCardProps> = ({ title, description, icon, children }) => (
  <div 
    className="border rounded-lg p-6 space-y-4"
    style={{
      backgroundColor: 'var(--surface-100)',
      borderColor: 'var(--border)'
    }}
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-600 rounded-lg">
        <HugeiconsIcon icon={icon} className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h3>
        <p className="text-sm" style={{ color: 'var(--surface-700)' }}>{description}</p>
      </div>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

// Profile Page Component
const ProfilePage: React.FC = () => {
  const { actualTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      fullName: 'John Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      bio: 'Full-stack developer passionate about creating amazing user experiences.',
      location: 'Kathmandu, Nepal',
      website: 'https://johndoe.dev',
      company: 'Tech Solutions Inc.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      joinDate: 'January 2023'
    };
  });

  const [editProfile, setEditProfile] = useState<UserProfile>(profile);

  const handleSaveProfile = () => {
    setProfile(editProfile);
    localStorage.setItem('userProfile', JSON.stringify(editProfile));
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditProfile(profile);
    setIsEditing(false);
  };

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      {/* Header */}
      <div 
        className="border-b"
        style={{ 
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface-100)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <HugeiconsIcon icon={UserIcon} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Profile</h1>
                <p style={{ color: 'var(--surface-700)' }}>Manage your personal information</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors"
                    style={{
                      backgroundColor: 'var(--surface-200)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4" />
                    Save Changes
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
                >
                  <HugeiconsIcon icon={Edit02Icon} className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side - Profile Image and Basic Info */}
          <div className="lg:col-span-1">
            <div 
              className="border rounded-lg p-6 space-y-6"
              style={{
                backgroundColor: 'var(--surface-100)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="text-center">
                <img
                  src={profile.avatar}
                  alt={profile.fullName}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  style={{ border: '4px solid var(--border)' }}
                />
                <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {profile.fullName}
                </h2>
                <p style={{ color: 'var(--surface-700)' }}>@{profile.username}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4" style={{ color: 'var(--surface-600)' }} />
                  <span className="text-sm" style={{ color: 'var(--surface-700)' }}>
                    Joined {profile.joinDate}
                  </span>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Home01Icon} className="w-4 h-4" style={{ color: 'var(--surface-600)' }} />
                    <span className="text-sm" style={{ color: 'var(--surface-700)' }}>
                      {profile.location}
                    </span>
                  </div>
                )}
                {profile.company && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={FolderIcon} className="w-4 h-4" style={{ color: 'var(--surface-600)' }} />
                    <span className="text-sm" style={{ color: 'var(--surface-700)' }}>
                      {profile.company}
                    </span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Share08Icon} className="w-4 h-4" style={{ color: 'var(--surface-600)' }} />
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Editable Form */}
          <div className="lg:col-span-2">
            <div 
              className="border rounded-lg p-6 space-y-6"
              style={{
                backgroundColor: 'var(--surface-100)',
                borderColor: 'var(--border)'
              }}
            >
              <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {isEditing ? 'Edit Profile Information' : 'Profile Information'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  value={isEditing ? editProfile.fullName : profile.fullName}
                  onChange={(value) => isEditing && setEditProfile(prev => ({ ...prev, fullName: value }))}
                  placeholder="Enter your full name"
                />
                
                <Input
                  label="Username"
                  value={isEditing ? editProfile.username : profile.username}
                  onChange={(value) => isEditing && setEditProfile(prev => ({ ...prev, username: value }))}
                  placeholder="Enter your username"
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={isEditing ? editProfile.email : profile.email}
                  onChange={(value) => isEditing && setEditProfile(prev => ({ ...prev, email: value }))}
                  placeholder="Enter your email"
                />
                
                <Input
                  label="Location"
                  value={isEditing ? editProfile.location : profile.location}
                  onChange={(value) => isEditing && setEditProfile(prev => ({ ...prev, location: value }))}
                  placeholder="Enter your location"
                />
                
                <Input
                  label="Website"
                  value={isEditing ? editProfile.website : profile.website}
                  onChange={(value) => isEditing && setEditProfile(prev => ({ ...prev, website: value }))}
                  placeholder="Enter your website URL"
                />
                
                <Input
                  label="Company"
                  value={isEditing ? editProfile.company : profile.company}
                  onChange={(value) => isEditing && setEditProfile(prev => ({ ...prev, company: value }))}
                  placeholder="Enter your company"
                />
              </div>
              
              <div className="md:col-span-2">
                <Textarea
                  label="Bio"
                  value={isEditing ? editProfile.bio : profile.bio}
                  onChange={(value) => isEditing && setEditProfile(prev => ({ ...prev, bio: value }))}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>
              
              {isEditing && (
                <div>
                  <Input
                    label="Avatar URL"
                    value={editProfile.avatar}
                    onChange={(value) => setEditProfile(prev => ({ ...prev, avatar: value }))}
                    placeholder="Enter image URL for your avatar"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Page Component
export const SettingsPage: React.FC = () => {
  const { theme, setTheme, actualTheme } = useTheme();
  const [language, setLanguage] = useState<LanguageType>(() => {
    const saved = localStorage.getItem('language');
    return (saved as LanguageType) || 'english';
  });
  
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : {
      email: true,
      push: false,
      sms: true,
      browser: true
    };
  });
  
  const [privacy, setPrivacy] = useState<PrivacySettings>(() => {
    const saved = localStorage.getItem('privacy');
    return saved ? JSON.parse(saved) : {
      profile: 'public',
      activity: 'friends',
      search: true
    };
  });
  
  const [preferences, setPreferences] = useState<PreferenceSettings>(() => {
    const saved = localStorage.getItem('preferences');
    return saved ? JSON.parse(saved) : {
      autoSave: true,
      compression: false,
      analytics: true,
      updates: 'stable'
    };
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('privacy', JSON.stringify(privacy));
  }, [privacy]);

  useEffect(() => {
    localStorage.setItem('preferences', JSON.stringify(preferences));
  }, [preferences]);

  const handleNotificationChange = (type: keyof NotificationSettings): void => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handlePrivacyChange = <K extends keyof PrivacySettings>(
    setting: K, 
    value: PrivacySettings[K]
  ): void => {
    setPrivacy(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handlePreferenceToggle = (setting: keyof Omit<PreferenceSettings, 'updates'>): void => {
    setPreferences(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handlePreferenceSelect = (setting: 'updates', value: UpdateChannelType): void => {
    setPreferences(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleLogout = () => {
    // if (confirm('Are you sure you want to logout?')) {
      // Clear user session data
      localStorage.removeItem('userSession');
      // Redirect would happen here in a real app
      // alert('Logged out successfully!');
    // }
  };

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      {/* Header */}
      <div 
        className="border-b"
        style={{ 
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface-100)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <HugeiconsIcon icon={Settings02Icon} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Settings</h1>
                <p style={{ color: 'var(--surface-700)' }}>Manage your account and application preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-200)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
                Export Settings
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 text-sm mb-8" style={{ color: 'var(--surface-700)' }}>
          <HugeiconsIcon icon={Home01Icon} className="w-4 h-4" />
          <span>Dashboard</span>
          <HugeiconsIcon icon={ArrowRight01Icon} className="w-3 h-3" />
          <span style={{ color: 'var(--foreground)' }}>Settings</span>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Appearance Settings */}
          <SettingCard
            title="Appearance"
            description="Customize the look and feel of your application"
            icon={EyeIcon}
          >
            <SelectField
              label="Theme"
              value={theme}
              onChange={(value: string) => setTheme(value as ThemeType)}
              icon={GridViewIcon}
              options={[
                { value: 'light', label: 'Light Mode' },
                { value: 'dark', label: 'Dark Mode' },
                { value: 'system', label: 'System Default' }
              ]}
            />
            {/* <SelectField
              label="Language"
              value={language}
              onChange={(value: string) => setLanguage(value as LanguageType)}
              icon={FileIcon}
              options={[
                { value: 'english', label: 'English' },
                { value: 'nepali', label: 'नेपाली' },
                { value: 'hindi', label: 'हिंदी' },
                { value: 'spanish', label: 'Español' }
              ]}
            /> */}
          </SettingCard>

          {/* Notification Settings */}
          {/* <SettingCard
            title="Notifications"
            description="Control how and when you receive notifications"
            icon={InformationCircleIcon}
          >
            <ToggleSwitch
              checked={notifications.email}
              onChange={() => handleNotificationChange('email')}
              label="Email Notifications"
            />
            <ToggleSwitch
              checked={notifications.push}
              onChange={() => handleNotificationChange('push')}
              label="Push Notifications (Not Implemented)"
            />
            <ToggleSwitch
              checked={notifications.sms}
              onChange={() => handleNotificationChange('sms')}
              label="SMS Notifications (Not Implemented)"
            />
            <ToggleSwitch
              checked={notifications.browser}
              onChange={() => handleNotificationChange('browser')}
              label="Browser Notifications"
            />
          </SettingCard> */}

          {/* Privacy Settings */}
          {/* <SettingCard
            title="Privacy & Security"
            description="Manage your privacy and security preferences"
            icon={FilterIcon}
          >
            <SelectField
              label="Profile Visibility"
              value={privacy.profile}
              onChange={(value: string) => handlePrivacyChange('profile', value as VisibilityType)}
              icon={EyeIcon}
              options={[
                { value: 'public', label: 'Public' },
                { value: 'friends', label: 'Friends Only' },
                { value: 'private', label: 'Private' }
              ]}
            />
            <SelectField
              label="Activity Status"
              value={privacy.activity}
              onChange={(value: string) => handlePrivacyChange('activity', value as ActivityType)}
              icon={Calendar01Icon}
              options={[
                { value: 'everyone', label: 'Everyone' },
                { value: 'friends', label: 'Friends Only' },
                { value: 'nobody', label: 'Nobody' }
              ]}
            />
            <ToggleSwitch
              checked={privacy.search}
              onChange={() => handlePrivacyChange('search', !privacy.search)}
              label="Allow search engines to index profile"
            />
            <div className="pt-2">
              <a 
                href="/admin/authenticator-setup"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <HugeiconsIcon icon={LockIcon} className="w-4 h-4" />
                Setup Two-Factor Authentication
              </a>
            </div>
          </SettingCard> */}

          {/* Application Preferences */}
       {/* Application Preferences */}
          {/* <SettingCard
            title="Application Preferences"
            description="Configure application behavior and features"
            icon={Settings02Icon}
          >
            <ToggleSwitch
              checked={preferences.autoSave}
              onChange={() => handlePreferenceToggle('autoSave')}
              label="Auto-save documents"
            />
            <ToggleSwitch
              checked={preferences.compression}
              onChange={() => handlePreferenceToggle('compression')}
              label="Enable file compression"
            />
            <ToggleSwitch
              checked={preferences.analytics}
              onChange={() => handlePreferenceToggle('analytics')}
              label="Allow analytics collection"
            />
            <SelectField
              label="Update Channel"
              value={preferences.updates}
              onChange={(value: string) => handlePreferenceSelect('updates', value as UpdateChannelType)}
              icon={Download01Icon}
              options={[
                { value: 'stable', label: 'Stable' },
                { value: 'beta', label: 'Beta' },
                { value: 'alpha', label: 'Alpha (Experimental)' }
              ]}
            />
          </SettingCard> */}

          {/* Account Management */}
          <SettingCard
            title="Account Management"
            description="Manage your account and data"
            icon={UserIcon}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-200)' }}>
                <div>
                  <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>Export Account Data</h4>
                  <p className="text-sm" style={{ color: 'var(--surface-700)' }}>Download all your account data</p>
                </div>
                <button className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
                  Export
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-200)' }}>
                <div>
                  <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>Delete Account</h4>
                  <p className="text-sm" style={{ color: 'var(--surface-700)' }}>Permanently delete your account</p>
                </div>
                <button className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                  Delete
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-200)' }}>
                <div>
                  <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>Logout</h4>
                  <p className="text-sm" style={{ color: 'var(--surface-700)' }}>Sign out of your account</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1 text-sm border rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--surface-100)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                >
                  <HugeiconsIcon icon={Logout01Icon} className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </SettingCard>
        </div>
      </div>
    </div>
  );
};