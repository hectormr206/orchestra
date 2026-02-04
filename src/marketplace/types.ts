/**
 * Plugin Marketplace Types
 */

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  main: string;
  orchestraVersion: string;
  hooks: Record<string, string>;
  config?: Record<string, unknown>;
  dependencies?: Record<string, string>;
}

export interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  license: string;
  repository: {
    type: 'github' | 'gitlab' | 'url';
    url: string;
    branch?: string;
  };
  tags: string[];
  category: string;
  downloads: number;
  rating: number;
  verified: boolean;
  official: boolean;
  createdAt: string;
  updatedAt: string;
  manifest: PluginManifest;
}

export interface PluginSearchResult {
  plugins: MarketplacePlugin[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MarketplaceRegistry {
  plugins: MarketplacePlugin[];
  categories: string[];
  tags: string[];
  lastUpdated: string;
}

export interface PluginInstallOptions {
  force?: boolean;
  verbose?: boolean;
  skipDeps?: boolean;
}

export interface PluginInstallResult {
  success: boolean;
  pluginId: string;
  version: string;
  installedPath: string;
  message: string;
  dependencies?: string[];
}

export interface MarketplaceConfig {
  registryUrl?: string;
  cacheDir?: string;
  cacheTTL?: number;
  verifyManifest?: boolean;
}
