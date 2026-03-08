export const getEnvDiagnostics = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  return {
    hasUrl: !!url,
    hasKey: !!key,
    hasProjectId: !!projectId,
    isConfigured: !!url && !!key,
    summary: !url || !key
      ? "⚠️ Missing backend environment variables. Data will not load."
      : "✅ Backend configured correctly.",
  };
};
