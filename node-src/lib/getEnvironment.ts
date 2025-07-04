export interface Environment {
  CHROMATIC_DNS_FAILOVER_SERVERS: string[];
  CHROMATIC_DNS_SERVERS: string[];
  CHROMATIC_HASH_CONCURRENCY: number;
  CHROMATIC_INDEX_URL: string;
  CHROMATIC_NOTIFY_SERVICE_URL: string;
  CHROMATIC_OUTPUT_INTERVAL: number;
  CHROMATIC_POLL_INTERVAL: number;
  CHROMATIC_PROJECT_TOKEN?: string;
  CHROMATIC_RETRIES: number;
  CHROMATIC_STORYBOOK_VERSION?: string;
  CHROMATIC_TIMEOUT: number;
  CHROMATIC_UPGRADE_TIMEOUT: number;
  ENVIRONMENT_WHITELIST: RegExp[];
  HTTP_PROXY?: string;
  HTTPS_PROXY?: string;
  STORYBOOK_BUILD_TIMEOUT: number;
  STORYBOOK_CLI_FLAGS_BY_VERSION: typeof STORYBOOK_CLI_FLAGS_BY_VERSION;
  STORYBOOK_VERIFY_TIMEOUT: number;
  STORYBOOK_NODE_ENV: string;
}

const {
  CHROMATIC_DNS_FAILOVER_SERVERS = '1.1.1.1, 8.8.8.8', // Cloudflare, Google
  CHROMATIC_DNS_SERVERS = '',
  CHROMATIC_HASH_CONCURRENCY = '48',
  CHROMATIC_INDEX_URL = 'https://index.chromatic.com',
  CHROMATIC_NOTIFY_SERVICE_URL,
  CHROMATIC_OUTPUT_INTERVAL = String(10 * 1000),
  CHROMATIC_POLL_INTERVAL = String(1000),
  CHROMATIC_PROJECT_TOKEN,
  CHROMATIC_RETRIES = '5',
  CHROMATIC_STORYBOOK_VERSION,
  CHROMATIC_TIMEOUT = String(5 * 60 * 1000),
  CHROMATIC_UPGRADE_TIMEOUT = String(60 * 60 * 1000),
  HTTP_PROXY = process.env.http_proxy,
  HTTPS_PROXY = process.env.https_proxy,
  STORYBOOK_BUILD_TIMEOUT = String(10 * 60 * 1000),
  STORYBOOK_VERIFY_TIMEOUT = String(3 * 60 * 1000),
  STORYBOOK_NODE_ENV = 'production',
} = process.env;

const ENVIRONMENT_WHITELIST = [/^GERRIT/, /^TRAVIS/];

const STORYBOOK_CLI_FLAGS_BY_VERSION = {
  '--ci': '4.0.0',
  '--loglevel': '5.1.0',
};

/**
 * Parse variables from the process environment.
 *
 * @returns An object containing parsed environment variables.
 */
export default function getEnvironment(): Environment {
  return {
    CHROMATIC_DNS_FAILOVER_SERVERS: CHROMATIC_DNS_FAILOVER_SERVERS.split(',')
      .map((ip) => ip.trim())
      .filter(Boolean),
    CHROMATIC_DNS_SERVERS: CHROMATIC_DNS_SERVERS.split(',')
      .map((ip) => ip.trim())
      .filter(Boolean),
    CHROMATIC_HASH_CONCURRENCY: Number.parseInt(CHROMATIC_HASH_CONCURRENCY, 10),
    CHROMATIC_INDEX_URL,
    CHROMATIC_NOTIFY_SERVICE_URL:
      CHROMATIC_NOTIFY_SERVICE_URL || getNotifyServiceUrl(CHROMATIC_INDEX_URL),
    CHROMATIC_OUTPUT_INTERVAL: Number.parseInt(CHROMATIC_OUTPUT_INTERVAL, 10),
    CHROMATIC_POLL_INTERVAL: Number.parseInt(CHROMATIC_POLL_INTERVAL, 10),
    CHROMATIC_PROJECT_TOKEN,
    CHROMATIC_RETRIES: Number.parseInt(CHROMATIC_RETRIES, 10),
    CHROMATIC_STORYBOOK_VERSION,
    CHROMATIC_TIMEOUT: Number.parseInt(CHROMATIC_TIMEOUT, 10),
    CHROMATIC_UPGRADE_TIMEOUT: Number.parseInt(CHROMATIC_UPGRADE_TIMEOUT, 10),
    ENVIRONMENT_WHITELIST,
    HTTP_PROXY,
    HTTPS_PROXY,
    STORYBOOK_BUILD_TIMEOUT: Number.parseInt(STORYBOOK_BUILD_TIMEOUT, 10),
    STORYBOOK_CLI_FLAGS_BY_VERSION,
    STORYBOOK_VERIFY_TIMEOUT: Number.parseInt(STORYBOOK_VERIFY_TIMEOUT, 10),
    STORYBOOK_NODE_ENV,
  };
}

function getNotifyServiceUrl(indexUrl: string) {
  if (indexUrl.includes('dev')) {
    return 'wss://notify.dev-chromatic.com';
  }

  if (indexUrl.includes('staging')) {
    return 'wss://notify.staging-chromatic.com';
  }

  return 'wss://notify.chromatic.com';
}
