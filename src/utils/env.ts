// Environment configuration utilities

interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
  apiTimeout: number;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    sttFallback: boolean;
    aiParseEnabled: boolean;
    fxAutoFetch: boolean;
    r3fBgEnabled: boolean;
    pwaEnabled: boolean;
  };
  debug: {
    debugMode: boolean;
    mockApi: boolean;
    performanceMonitoring: boolean;
    autoLogin: boolean;
  };
  auth: {
    googleClientId?: string;
  };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value;
};

const getEnvBool = (key: string, defaultValue = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = import.meta.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(
        `Environment variable ${key} is required but not defined`
      );
    }
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
};

export const env: EnvironmentConfig = {
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000'),
  apiTimeout: getEnvNumber('VITE_API_TIMEOUT', 6000),
  appVersion: getEnvVar('VITE_APP_VERSION', '0.1.0'),
  environment: getEnvVar(
    'VITE_APP_ENV',
    'development'
  ) as EnvironmentConfig['environment'],

  features: {
    sttFallback: getEnvBool('VITE_FEATURE_STT_FALLBACK', true),
    aiParseEnabled: getEnvBool('VITE_FEATURE_AI_PARSE_ENABLED', true),
    fxAutoFetch: getEnvBool('VITE_FEATURE_FX_AUTO_FETCH', true),
    r3fBgEnabled: getEnvBool('VITE_FEATURE_R3F_BG_ENABLED', true),
    pwaEnabled: getEnvBool('VITE_PWA_ENABLED', true),
  },

  debug: {
    debugMode: getEnvBool('VITE_DEBUG_MODE', false),
    mockApi: getEnvBool('VITE_MOCK_API', false),
    performanceMonitoring: getEnvBool('VITE_PERFORMANCE_MONITORING', false),
    autoLogin: getEnvBool('VITE_DEBUG_AUTO_LOGIN', true), // Hardcoded to true for development
  },

  auth: {
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  },
};

export const isDevelopment = env.environment === 'development';
export const isProduction = env.environment === 'production';
export const isStaging = env.environment === 'staging';

// Validate required environment variables
export const validateEnvironment = (): void => {
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

  const missing = requiredVars.filter((varName) => !import.meta.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }
};

// Call validation on module load in development
if (isDevelopment) {
  try {
    validateEnvironment();
  } catch (error) {
    console.warn('Environment validation warning:', error);
  }
}
