# Live-site visual audit — tiredroponline.com

**Date:** 2026-09-24

**Result:** Blocked: 000, proxy status:

```json
{
  "enabled": true,
  "port": 38633,
  "caBundlePath": "/root/.ccr/ca-bundle.crt",
  "hasSystemCa": true,
  "bundleCoversEveryHost": true,
  "noProxy": "localhost,127.0.0.1,::1,127.0.0.0/8,0.0.0.0/8,::,169.254.0.0/16,api.anthropic.com,api-staging.anthropic.com,api-pr-preview.anthropic.com,mcp-proxy.anthropic.com,mcp-proxy-staging.anthropic.com,registry.npmjs.org,jsr.io,npm.jsr.io,pypi.org,files.pythonhosted.org,index.crates.io,proxy.golang.org,host.docker.internal,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,100.64.0.0/10,.svc.cluster.local,*.svc.cluster.local",
  "selective": false,
  "standalone": false,
  "toolScoped": false,
  "installedProxyPreconfiguredClis": [],
  "javaTrustStorePath": "/etc/ssl/certs/java/cacerts",
  "javaTrustStoreType": "JKS",
  "readmePath": "/root/.ccr/README.md",
```

The agent proxy rejected the outbound CONNECT to `tiredroponline.com:443` (`connect_rejected`: organization network policy denied it, or the host was unreachable). Nothing was measured, no screenshots were taken, and nothing on Shopify was touched.

To run this audit, allow `tiredroponline.com` (and `*.shopify.com` / `cdn.shopify.com` for assets) in this environment's network policy, then run the audit again.
