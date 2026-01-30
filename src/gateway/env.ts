import type { MoltbotEnv } from '../types';

/**
 * Build environment variables to pass to the Moltbot container process
 * 
 * @param env - Worker environment bindings
 * @returns Environment variables record
 */
export function buildEnvVars(env: MoltbotEnv): Record<string, string> {
  const envVars: Record<string, string> = {};

  const isOpenAIGateway = env.AI_GATEWAY_BASE_URL?.endsWith('/openai');
  const useOpenAI = !!env.OPENAI_API_KEY || !!env.OPENAI_BASE_URL;

  if (useOpenAI && env.OPENAI_API_KEY) {
    envVars.OPENAI_API_KEY = env.OPENAI_API_KEY;
  } else if (env.AI_GATEWAY_API_KEY) {
    if (isOpenAIGateway) {
      envVars.OPENAI_API_KEY = env.AI_GATEWAY_API_KEY;
    } else {
      envVars.ANTHROPIC_API_KEY = env.AI_GATEWAY_API_KEY;
    }
  }

  if (!useOpenAI && !envVars.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY) {
    envVars.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  }

  if (useOpenAI) {
    if (env.OPENAI_BASE_URL) {
      envVars.OPENAI_BASE_URL = env.OPENAI_BASE_URL;
    }
  } else if (env.AI_GATEWAY_BASE_URL) {
    envVars.AI_GATEWAY_BASE_URL = env.AI_GATEWAY_BASE_URL;
    if (isOpenAIGateway) {
      envVars.OPENAI_BASE_URL = env.AI_GATEWAY_BASE_URL;
    } else {
      envVars.ANTHROPIC_BASE_URL = env.AI_GATEWAY_BASE_URL;
    }
  } else if (env.ANTHROPIC_BASE_URL) {
    envVars.ANTHROPIC_BASE_URL = env.ANTHROPIC_BASE_URL;
  }
  const gatewayToken = env.MOLTBOT_GATEWAY_TOKEN || env.CLAWDBOT_GATEWAY_TOKEN;
  if (gatewayToken) envVars.CLAWDBOT_GATEWAY_TOKEN = gatewayToken;
  if (env.DEV_MODE) envVars.CLAWDBOT_DEV_MODE = env.DEV_MODE; // Pass DEV_MODE as CLAWDBOT_DEV_MODE to container
  if (env.CLAWDBOT_BIND_MODE) envVars.CLAWDBOT_BIND_MODE = env.CLAWDBOT_BIND_MODE;
  if (env.TELEGRAM_BOT_TOKEN) envVars.TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
  if (env.TELEGRAM_DM_POLICY) envVars.TELEGRAM_DM_POLICY = env.TELEGRAM_DM_POLICY;
  if (env.DISCORD_BOT_TOKEN) envVars.DISCORD_BOT_TOKEN = env.DISCORD_BOT_TOKEN;
  if (env.DISCORD_DM_POLICY) envVars.DISCORD_DM_POLICY = env.DISCORD_DM_POLICY;
  if (env.SLACK_BOT_TOKEN) envVars.SLACK_BOT_TOKEN = env.SLACK_BOT_TOKEN;
  if (env.SLACK_APP_TOKEN) envVars.SLACK_APP_TOKEN = env.SLACK_APP_TOKEN;
  if (env.CDP_SECRET) envVars.CDP_SECRET = env.CDP_SECRET;
  if (env.WORKER_URL) envVars.WORKER_URL = env.WORKER_URL;

  return envVars;
}
