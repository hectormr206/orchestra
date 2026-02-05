/**
 * Configuration Profiles Management
 *
 * Support for different environment configurations (dev, staging, prod, etc.)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import type { TUISettings } from './configLoader.js';

export interface ProfileConfig {
  name: string;
  inherits?: string; // Profile to inherit from
  settings: Partial<TUISettings>;
  environment?: Record<string, string>; // Environment variables
}

export interface ProfileManager {
  loadProfile(profileName: string): ProfileConfig | null;
  saveProfile(profile: ProfileConfig): void;
  listProfiles(): string[];
  deleteProfile(profileName: string): void;
  applyProfile(profileName: string): TUISettings;
}

const PROFILES_DIR = '.orchestra/profiles';
const PROFILES_FILE = '.orchestra/profiles.json';

class ProfileManagerImpl implements ProfileManager {
  private profiles: Map<string, ProfileConfig> = new Map();
  private currentProfile?: string;

  constructor() {
    this.loadProfiles();
  }

  /**
   * Load all profiles from filesystem
   */
  private loadProfiles(): void {
    this.profiles.clear();

    // Load profiles index
    if (existsSync(PROFILES_FILE)) {
      try {
        const content = readFileSync(PROFILES_FILE, 'utf-8');
        const data = JSON.parse(content);
        for (const [name, profile] of Object.entries(data)) {
          this.profiles.set(name, profile as ProfileConfig);
        }
      } catch (e) {
        // Start with empty profiles
      }
    }

    // Create default profiles if none exist
    if (this.profiles.size === 0) {
      this.createDefaultProfiles();
    }
  }

  /**
   * Create default profiles
   */
  private createDefaultProfiles(): void {
    const defaults: Record<string, ProfileConfig> = {
      development: {
        name: 'development',
        settings: {
          parallel: true,
          maxConcurrency: 2,
          autoApprove: false,
          runTests: true,
          gitCommit: false,
          notifications: true,
          cacheEnabled: true,
          maxRecoveryAttempts: 3,
          recoveryTimeoutMinutes: 10,
          autoRevertOnFailure: false,
        },
        environment: {
          NODE_ENV: 'development',
          ORCHESTRA_LOG_LEVEL: 'debug',
        },
      },
      staging: {
        name: 'staging',
        inherits: 'development',
        settings: {
          parallel: false,
          autoApprove: false,
          gitCommit: true,
        },
        environment: {
          NODE_ENV: 'production',
          ORCHESTRA_LOG_LEVEL: 'info',
        },
      },
      production: {
        name: 'production',
        inherits: 'development',
        settings: {
          parallel: false,
          autoApprove: false,
          runTests: false,
          gitCommit: true,
          notifications: true,
          cacheEnabled: true,
        },
        environment: {
          NODE_ENV: 'production',
          ORCHESTRA_LOG_LEVEL: 'warn',
        },
      },
      'ci-cd': {
        name: 'ci-cd',
        inherits: 'production',
        settings: {
          autoApprove: true,
          parallel: true,
          maxConcurrency: 5,
          notifications: false,
        },
        environment: {
          CI: 'true',
          ORCHESTRA_LOG_LEVEL: 'warn',
        },
      },
    };

    for (const [name, profile] of Object.entries(defaults)) {
      this.profiles.set(name, profile);
    }

    this.saveProfiles();
  }

  /**
   * Save profiles to filesystem
   */
  private saveProfiles(): void {
    const data: Record<string, ProfileConfig> = {};
    for (const [name, profile] of this.profiles) {
      data[name] = profile;
    }

    // Create profiles directory
    if (!existsSync(PROFILES_DIR)) {
      mkdirSync(PROFILES_DIR, { recursive: true });
    }

    writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Load a specific profile
   */
  loadProfile(profileName: string): ProfileConfig | null {
    return this.profiles.get(profileName) || null;
  }

  /**
   * Save a profile
   */
  saveProfile(profile: ProfileConfig): void {
    this.profiles.set(profile.name, profile);
    this.saveProfiles();
  }

  /**
   * List all available profiles
   */
  listProfiles(): string[] {
    return Array.from(this.profiles.keys());
  }

  /**
   * Delete a profile
   */
  deleteProfile(profileName: string): void {
    this.profiles.delete(profileName);
    this.saveProfiles();
  }

  /**
   * Apply a profile and return merged settings
   */
  applyProfile(profileName: string): TUISettings {
    const profile = this.loadProfile(profileName);
    if (!profile) {
      throw new Error(`Profile "${profileName}" not found`);
    }

    this.currentProfile = profileName;

    // Merge settings with inheritance
    const settings = this.mergeSettings(profile);

    // Set environment variables
    if (profile.environment) {
      for (const [key, value] of Object.entries(profile.environment)) {
        process.env[key] = value;
      }
    }

    return settings;
  }

  /**
   * Merge settings with inheritance
   */
  private mergeSettings(profile: ProfileConfig): TUISettings {
    let settings: Partial<TUISettings> = { ...profile.settings };

    // Apply inheritance if specified
    if (profile.inherits) {
      const parentProfile = this.loadProfile(profile.inherits);
      if (parentProfile) {
        const parentSettings = this.mergeSettings(parentProfile);
        settings = { ...parentSettings, ...settings };
      }
    }

    // Default settings
    const defaults: TUISettings = {
      parallel: true,
      maxConcurrency: 3,
      autoApprove: false,
      runTests: false,
      testCommand: 'npm test',
      gitCommit: false,
      notifications: true,
      cacheEnabled: true,
      maxRecoveryAttempts: 3,
      recoveryTimeoutMinutes: 10,
      autoRevertOnFailure: true,
      agents: {
        architect: ['Kimi k2.5', 'Gemini 3 Pro'],
        executor: ['GLM-4.7', 'Kimi k2.5'],
        auditor: ['Gemini 3 Pro', 'GPT-5.2-Codex'],
        consultant: ['GPT-5.2-Codex', 'Kimi k2.5'],
      },
    };

    return { ...defaults, ...settings };
  }

  /**
   * Get current active profile name
   */
  getCurrentProfile(): string | undefined {
    return this.currentProfile;
  }
}

// Singleton instance
let profileManagerInstance: ProfileManagerImpl | null = null;

export function getProfileManager(): ProfileManager {
  if (!profileManagerInstance) {
    profileManagerInstance = new ProfileManagerImpl();
  }
  return profileManagerInstance;
}

/**
 * Load profile by name from command line or environment
 */
export function loadActiveProfile(): TUISettings | null {
  const profileManager = getProfileManager();

  // Check ORCHESTRA_PROFILE environment variable
  const profileName = process.env.ORCHESTRA_PROFILE;

  if (profileName) {
    try {
      return profileManager.applyProfile(profileName);
    } catch (e) {
      console.error(`Failed to load profile "${profileName}": ${e}`);
      return null;
    }
  }

  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    try {
      return profileManager.applyProfile('production');
    } catch (e) {
      // Ignore if production profile doesn't exist
    }
  } else if (nodeEnv === 'development' || !nodeEnv) {
    try {
      return profileManager.applyProfile('development');
    } catch (e) {
      // Ignore if development profile doesn't exist
    }
  }

  return null;
}
