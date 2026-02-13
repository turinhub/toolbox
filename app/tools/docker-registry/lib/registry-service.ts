"use server";

interface RegistryConfig {
  url: string;
  username?: string;
  password?: string;
}

async function fetchWithAuth(
  url: string,
  config: RegistryConfig,
  options: RequestInit = {}
) {
  // 1. Prepare headers
  const headers = new Headers(options.headers);

  // Initial attempt: If username/password provided, use Basic Auth
  // (Note: Some registries might reject Basic Auth on the API endpoint and require Token,
  // but usually they return 401 and we handle it below.
  // However, sending credentials proactively is common for Basic Auth setups)
  if (config.username && config.password) {
    const auth = Buffer.from(`${config.username}:${config.password}`).toString(
      "base64"
    );
    headers.set("Authorization", `Basic ${auth}`);
  }

  let res = await fetch(url, { ...options, headers });

  // 2. Handle 401 Unauthorized (Token Auth flow)
  if (res.status === 401) {
    const authHeader = res.headers.get("www-authenticate");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer")) {
      // Parse Www-Authenticate header
      // Format: Bearer realm="...",service="...",scope="..."
      const params: Record<string, string> = {};
      const parts = authHeader.substring(7).split(",");

      for (const part of parts) {
        const [key, value] = part.trim().split("=");
        if (key && value) {
          params[key] = value.replace(/"/g, "");
        }
      }

      if (params.realm) {
        // Construct token URL
        const tokenUrl = new URL(params.realm);
        if (params.service)
          tokenUrl.searchParams.append("service", params.service);

        // Scope might be in the original 401 response or we might need to infer it?
        // Usually it's in the Www-Authenticate header of the 401 response for the specific resource we tried to access.
        if (params.scope) tokenUrl.searchParams.append("scope", params.scope);

        // Request token
        const tokenHeaders = new Headers();
        if (config.username && config.password) {
          const auth = Buffer.from(
            `${config.username}:${config.password}`
          ).toString("base64");
          tokenHeaders.set("Authorization", `Basic ${auth}`);
        }

        try {
          const tokenRes = await fetch(tokenUrl.toString(), {
            headers: tokenHeaders,
          });

          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            const token = tokenData.token || tokenData.access_token;

            if (token) {
              // Retry with Bearer token
              const newHeaders = new Headers(options.headers);
              newHeaders.set("Authorization", `Bearer ${token}`);
              res = await fetch(url, { ...options, headers: newHeaders });
            }
          }
        } catch (e) {
          console.error("Token fetch failed:", e);
        }
      }
    }
  }

  return res;
}

export async function checkConnection(config: RegistryConfig) {
  try {
    // Ensure URL doesn't end with slash for consistency in logic,
    // but here we append /v2/ which handles it.
    // Better to sanitize config.url
    const baseUrl = config.url.replace(/\/$/, "");
    const res = await fetchWithAuth(`${baseUrl}/v2/`, config);

    if (res.ok) {
      // Also check if we get a Docker-Distribution-Api-Version header?
      // Not strictly necessary if status is 200.
      return { success: true };
    }
    return {
      success: false,
      error: `Connection failed: ${res.status} ${res.statusText}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getCatalog(config: RegistryConfig) {
  try {
    const baseUrl = config.url.replace(/\/$/, "");
    const res = await fetchWithAuth(`${baseUrl}/v2/_catalog`, config);

    if (!res.ok) {
      throw new Error(`Failed to get catalog: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return { success: true, repositories: data.repositories || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getTags(config: RegistryConfig, repository: string) {
  try {
    const baseUrl = config.url.replace(/\/$/, "");
    const res = await fetchWithAuth(
      `${baseUrl}/v2/${repository}/tags/list`,
      config
    );

    if (!res.ok) {
      throw new Error(`Failed to get tags: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return { success: true, tags: data.tags || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getManifest(
  config: RegistryConfig,
  repository: string,
  reference: string
) {
  try {
    const baseUrl = config.url.replace(/\/$/, "");
    // Request v2 manifest by default
    const headers = {
      Accept:
        "application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.manifest.v1+json",
    };

    const res = await fetchWithAuth(
      `${baseUrl}/v2/${repository}/manifests/${reference}`,
      config,
      { headers }
    );

    if (!res.ok) {
      throw new Error(
        `Failed to get manifest: ${res.status} ${res.statusText}`
      );
    }

    const data = await res.json();
    // Also get digest from header
    const digest = res.headers.get("Docker-Content-Digest");

    return { success: true, manifest: data, digest };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteManifest(
  config: RegistryConfig,
  repository: string,
  digest: string
) {
  try {
    const baseUrl = config.url.replace(/\/$/, "");
    const res = await fetchWithAuth(
      `${baseUrl}/v2/${repository}/manifests/${digest}`,
      config,
      {
        method: "DELETE",
      }
    );

    if (res.ok || res.status === 202) {
      return { success: true };
    }
    return {
      success: false,
      error: `Delete failed: ${res.status} ${res.statusText}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
