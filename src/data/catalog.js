// ── Infoblox Seller / Channel-Partner Copilot — Product Catalog & Token Engine ─
//
// ═══════════════════════════════════════════════════════════════════════════════
//  DECLARED ASSUMPTIONS
// ═══════════════════════════════════════════════════════════════════════════════
//
// A.  ENVIRONMENT MODEL
//   A1.  Each branch site hosts 50 managed endpoints on average
//        (workstations, IP phones, printers, IoT, servers).
//   A2.  Each hub/regional-DC site hosts 200 managed endpoints
//        (virtualisation hosts, network infra, DMZ servers, management).
//   A3.  Peak DNS query rate per site:  30 QPS for branch, 150 QPS for hub.
//        "Peak" = busiest 5-minute window; aligns with Infoblox's billing metric.
//   A4.  DNS cache hit ratio (CHR): 85 % — industry standard for an enterprise
//        recursive resolver with a warm cache.  Infoblox measures effective QPS
//        at this CHR when quoting form-factor performance.
//   A5.  DHCP networks per site: 2 per branch (user + voice/IoT VLAN),
//        5 per hub (user / voice / server / DMZ / management).
//   A6.  DNS zones per site: 3 (corporate forward zone, reverse zone,
//        split-horizon internal zone).
//   A7.  Monthly DNS + DHCP log events: 2 M per branch, 10 M per hub.
//        Based on 30 QPS branch peak × active 8h/day × 22 workdays ≈ 19 M;
//        conservative 2 M used to account for off-peak and weekend reduction.
//   A8.  QoS headroom factor: ×1.3 applied to peak QPS before form-factor
//        selection, ensuring servers never run above ~75 % utilisation.
//   A9.  High-availability: one HA pair (2 NIOSXaaS members) deployed per region.
//        No single-member deployments assumed for production.
//
// B.  TOKEN MODEL
//   B1.  Management tokens: ~1 token per 5 active managed IP addresses.
//        Infoblox's public FAQ states management tokens are based on "active IP
//        addresses and DDI objects"; the 1:5 ratio is a common pre-sales estimate
//        and should be confirmed per-customer during scoping.
//   B2.  Server tokens: per-form-factor values (XS 250, S 470, M 940, L 1 880,
//        XL 3 760) sourced from Infoblox Universal DDI Licensing public docs.
//   B3.  Reporting tokens: 40 tokens per 10 M log events/month — confirmed from
//        Infoblox Universal DDI Tokens customer FAQs (public).
//   B4.  Token pack sizes: Management 1 000, Server 500, Reporting 40.
//        All quantities rounded UP to the next full pack.
//
// C.  NIOSXAAS FORM FACTOR HARDWARE
//   C1.  XS: 8 vCPU / 8 GB RAM — confirmed from Infoblox minimum system
//        requirements documentation.
//   C2.  S: 8 vCPU / 16 GB RAM — estimated; consistent with OpenShift 16 GB
//        recommendation published by Infoblox.
//   C3.  M / L / XL vCPU and RAM: estimated by doubling each tier.
//        Official datasheet (insights.infoblox.com) was returning 503 at time
//        of authoring; mark as ESTIMATED in any customer-facing materials.
//   C4.  DNS QPS at 85 % CHR:
//        XS 681, S 2 900, M 14 800, L 35 000 — sourced from Infoblox published
//        performance benchmarks.  XL 70 000 — estimated (2× L).
//   C5.  DHCP leases/second and IPAM object limits — proportionally estimated
//        from hardware resources; not officially published at time of authoring.
//
// D.  NIOSXAAS CLOUD PLACEMENT
//   D1.  Latency target: <20 ms from hub to NIOSXaaS for DNS resolution inline
//        with the Versa SD-WAN control-plane and data-plane.
//   D2.  Preference order: same-city cloud PoP > same-country PoP > nearest
//        low-latency PoP.
//   D3.  AWS regions used as reference; Azure and GCP equivalents available on
//        request.
//   D4.  Africa: AWS af-south-1 (Cape Town) is the only native AWS Africa region;
//        Nairobi-anchored deployments may use DXB as a low-latency alternative
//        (<120 ms) or a bare-metal colocation in Nairobi data centres.
//
// ═══════════════════════════════════════════════════════════════════════════════

// ── NIOSXaaS Form Factors ─────────────────────────────────────────────────────
// dnsQPS_85CHR = DNS queries per second at 85 % cache hit ratio (published benchmarks)
// dhcpLPS      = DHCP leases per second             (C5 — estimated)
// ipamObjects  = max IPAM host/network/zone objects  (C5 — estimated)
export const niosxSizes = [
  {
    id: 'xs', label: 'XS',
    serverTokens: 250,                 // B2 — confirmed
    vCPU: 8, ramGB: 8,                 // C1 — confirmed
    storageGB: 250,
    dnsQPS_85CHR: 681,                 // C4 — confirmed
    dnsQPS_0CHR:  160,
    dhcpLPS: 10,                       // C5 — estimated
    ipamObjects: 50_000,               // C5 — estimated
    maxSites: 5,
    cloudEquiv: 't3.2xlarge (8 vCPU / 32 GB) — right-size via RAM-tuned instance',
    useCase: 'Remote / small branch PoP, lab, or lightweight edge deployment up to 5 sites.',
  },
  {
    id: 's', label: 'S',
    serverTokens: 470,                 // B2 — confirmed
    vCPU: 8, ramGB: 16,               // C2 — estimated
    storageGB: 500,
    dnsQPS_85CHR: 2_900,              // C4 — confirmed
    dnsQPS_0CHR:  700,
    dhcpLPS: 50,                       // C5 — estimated
    ipamObjects: 200_000,
    maxSites: 15,
    cloudEquiv: 'r5.2xlarge (8 vCPU / 64 GB) or equivalent memory-optimised',
    useCase: 'Small regional hub serving 5–15 branch sites.',
  },
  {
    id: 'm', label: 'M',
    serverTokens: 940,                 // B2 — confirmed
    vCPU: 16, ramGB: 32,              // C3 — estimated
    storageGB: 1_000,
    dnsQPS_85CHR: 14_800,             // C4 — confirmed
    dnsQPS_0CHR:  3_500,
    dhcpLPS: 200,                      // C5 — estimated
    ipamObjects: 500_000,
    maxSites: 40,
    cloudEquiv: 'r5.4xlarge (16 vCPU / 128 GB) or equivalent',
    useCase: 'Medium regional hub, primary DNS resolver, 15–40 branch sites.',
  },
  {
    id: 'l', label: 'L',
    serverTokens: 1_880,              // B2 — confirmed
    vCPU: 32, ramGB: 64,             // C3 — estimated
    storageGB: 2_000,
    dnsQPS_85CHR: 35_000,            // C4 — confirmed
    dnsQPS_0CHR:  7_000,
    dhcpLPS: 1_000,                   // C5 — estimated
    ipamObjects: 2_000_000,
    maxSites: 100,
    cloudEquiv: 'r5.8xlarge (32 vCPU / 256 GB) or equivalent',
    useCase: 'Large regional anchor or Grid Master candidate, 40–100 branch sites.',
  },
  {
    id: 'xl', label: 'XL',
    serverTokens: 3_760,             // B2 — confirmed
    vCPU: 64, ramGB: 128,           // C3 — estimated
    storageGB: 4_000,
    dnsQPS_85CHR: 70_000,           // C4 — estimated (2× L)
    dnsQPS_0CHR:  14_000,
    dhcpLPS: 5_000,                  // C5 — estimated
    ipamObjects: 10_000_000,
    maxSites: 300,
    cloudEquiv: 'r5.16xlarge (64 vCPU / 512 GB) or equivalent',
    useCase: 'Global Grid Master, enterprise DNS anchor for 100+ sites or multi-region deployments.',
  },
]

// ── Token Pack Sizes ──────────────────────────────────────────────────────────
export const tokenPacks = {
  management: { packSize: 1_000, note: 'Based on active IPs, IPAM objects, DDI assets' },
  server:     { packSize: 500,   note: 'Based on number, size, and type of NIOSXaaS servers' },
  reporting:  { packSize: 40,    note: 'Per 10 M log/event records per month' },
}

// ── Recommended NIOSXaaS Cloud Placement ─────────────────────────────────────
// Primary = preferred PoP for lowest latency to Versa SD-WAN hub
// Secondary = failover / geo-redundancy PoP
export const regionCloudMap = {
  'North America': {
    primary:   { cloud: 'AWS', region: 'us-east-1 (N. Virginia)',  latencyToHub: '~4 ms'  },
    secondary: { cloud: 'AWS', region: 'us-west-2 (Oregon)',       latencyToHub: '~8 ms'  },
    notes: 'Co-locate with Versa Controller in us-east-1.  West-coast branches benefit from an additional S/XS member in us-west-2 for split-horizon resolution.',
  },
  'Europe': {
    primary:   { cloud: 'AWS', region: 'eu-central-1 (Frankfurt)', latencyToHub: '~2 ms'  },
    secondary: { cloud: 'AWS', region: 'eu-west-1 (Ireland)',      latencyToHub: '~12 ms' },
    notes: 'Frankfurt anchors FRA-Hub and LON-Hub within <10 ms.  Ireland secondary covers UK branches if Frankfurt has an AZ failure.',
  },
  'Asia-Pacific': {
    primary:   { cloud: 'AWS', region: 'ap-southeast-1 (Singapore)', latencyToHub: '~2 ms'  },
    secondary: { cloud: 'AWS', region: 'ap-northeast-1 (Tokyo)',     latencyToHub: '~2 ms'  },
    notes: 'Deploy independent HA pairs in Singapore and Tokyo — 55 ms between them is too high to share a pair.  India branches can use ap-south-1 (Mumbai) as a third anchor.',
  },
  'Middle East': {
    primary:   { cloud: 'AWS', region: 'me-central-1 (UAE)',    latencyToHub: '~3 ms'  },
    secondary: { cloud: 'AWS', region: 'me-south-1 (Bahrain)',  latencyToHub: '~18 ms' },
    notes: 'me-central-1 (UAE) is the closest to DXB-Hub-01.  Bahrain secondary adds resilience across GCC countries.',
  },
  'Latin America': {
    primary:   { cloud: 'AWS', region: 'sa-east-1 (São Paulo)',  latencyToHub: '~3 ms'  },
    secondary: { cloud: 'AWS', region: 'us-east-1 (N. Virginia)', latencyToHub: '~120 ms' },
    notes: 'No second AWS region in Latin America at this time.  Secondary falls back to us-east-1; consider Azure Brazil South as a closer alternative.',
  },
  'Africa': {
    primary:   { cloud: 'AWS',  region: 'af-south-1 (Cape Town)',    latencyToHub: '~25 ms to JNB' },
    secondary: { cloud: 'Colo', region: 'Nairobi IX (KIXP) or Teraco JNB', latencyToHub: '~5 ms' },
    notes: 'af-south-1 is the only native AWS Africa region.  For Nairobi-primary deployments, bare-metal colocation at KIXP delivers <5 ms; use af-south-1 as the warm standby.',
  },
}

// ── Demo Environment Snapshot (matches devices.js) ───────────────────────────
export const demoEnv = {
  totalDevices: 87,
  hubs: 9,
  branches: 78,
  regions: 6,
  endpointsPerBranch: 50,  // A1
  endpointsPerHub:   200,  // A2
  peakQpsPerBranch:   30,  // A3
  peakQpsPerHub:     150,  // A3
  chrPct:             85,  // A4
  eventsPerBranchPerMonth: 2_000_000,   // A7
  eventsPerHubPerMonth:   10_000_000,   // A7
  headroomFactor: 1.3,                  // A8
}

// ── Regional site breakdown (for per-region sizing) ───────────────────────────
export const regionBreakdown = {
  'North America': { branches: 19, hubs: 3 },
  'Europe':        { branches: 16, hubs: 2 },
  'Asia-Pacific':  { branches: 18, hubs: 3 },
  'Middle East':   { branches: 7,  hubs: 1 },
  'Latin America': { branches: 7,  hubs: 1 },
  'Africa':        { branches: 3,  hubs: 1 },  // includes Nairobi (offline)
}

// ── Token Calculator ──────────────────────────────────────────────────────────
// Inputs:
//   sites           – total number of sites (branches + hubs)
//   hubCount        – number of hub/DC sites
//   endpointsPerBranch, endpointsPerHub
//   peakQpsPerBranch, peakQpsPerHub
//   eventsPerBranchPerMonth, eventsPerHubPerMonth
//   haEnabled       – boolean, deploy HA pair per region (default true)
//   regionCount     – number of regions to deploy NIOSXaaS
//
// Returns { management, server, reporting, total, packs, regionSizing }
export function calculateTokens(inputs = {}) {
  const {
    sites              = demoEnv.totalDevices,
    hubCount           = demoEnv.hubs,
    endpointsPerBranch = demoEnv.endpointsPerBranch,
    endpointsPerHub    = demoEnv.endpointsPerHub,
    peakQpsPerBranch   = demoEnv.peakQpsPerBranch,
    peakQpsPerHub      = demoEnv.peakQpsPerHub,
    eventsPerBranchPM  = demoEnv.eventsPerBranchPerMonth,
    eventsPerHubPM     = demoEnv.eventsPerHubPerMonth,
    haEnabled          = true,
    regionCount        = demoEnv.regions,
    regBreakdown       = regionBreakdown,
  } = inputs

  const branchCount = sites - hubCount

  // ── Management Tokens ────────────────────────────────────────────────────
  const totalManagedIPs = branchCount * endpointsPerBranch + hubCount * endpointsPerHub
  const rawMgmt = Math.ceil(totalManagedIPs / 5)  // B1 — 1 token per 5 IPs
  const mgmtPacks = Math.ceil(rawMgmt / tokenPacks.management.packSize)
  const mgmtTokens = mgmtPacks * tokenPacks.management.packSize

  // ── Server Tokens (per-region sizing) ────────────────────────────────────
  const haMultiplier = haEnabled ? 2 : 1
  const regionSizing = {}
  let rawServer = 0

  for (const [region, { branches, hubs }] of Object.entries(regBreakdown)) {
    const peakQps = branches * peakQpsPerBranch + hubs * peakQpsPerHub
    const requiredQps = Math.ceil(peakQps * demoEnv.headroomFactor)  // A8
    const form = niosxSizes.find(s => s.dnsQPS_85CHR >= requiredQps) ?? niosxSizes[niosxSizes.length - 1]
    const tokensForRegion = form.serverTokens * haMultiplier
    rawServer += tokensForRegion
    regionSizing[region] = {
      branches, hubs, peakQps, requiredQps,
      formFactor: form.label,
      serversDeployed: haMultiplier,
      serverTokensUsed: tokensForRegion,
      vCPU: form.vCPU, ramGB: form.ramGB,
      dnsQpsCapacity: form.dnsQPS_85CHR,
      cloudPlacement: regionCloudMap[region],
    }
  }
  const serverPacks = Math.ceil(rawServer / tokenPacks.server.packSize)
  const serverTokens = serverPacks * tokenPacks.server.packSize

  // ── Reporting Tokens ─────────────────────────────────────────────────────
  const monthlyEvents = branchCount * eventsPerBranchPM + hubCount * eventsPerHubPM
  const rawReporting = Math.ceil(monthlyEvents / 10_000_000) * tokenPacks.reporting.packSize  // B3
  const reportingPacks = Math.ceil(rawReporting / tokenPacks.reporting.packSize)
  const reportingTokens = reportingPacks * tokenPacks.reporting.packSize

  const total = mgmtTokens + serverTokens + reportingTokens

  return {
    inputs: { sites, hubCount, branchCount, totalManagedIPs, regionCount },
    management: { raw: rawMgmt, tokens: mgmtTokens, packs: mgmtPacks },
    server:     { raw: rawServer, tokens: serverTokens, packs: serverPacks },
    reporting:  { raw: rawReporting, tokens: reportingTokens, packs: reportingPacks, monthlyEvents },
    total,
    regionSizing,
  }
}

// ── Demo Estimate (pre-computed for mock replies) ─────────────────────────────
export const demoTokenEstimate = calculateTokens()

// ── Illustrative SKU List (for demo — not official Infoblox part numbers) ────
export const skuCatalog = [
  {
    sku: 'IB-UDDIDDI-MGT-1K',
    name: 'Universal DDI — Management Tokens (1 000-pack)',
    description: 'Covers active IP addresses and IPAM/DNS/DHCP objects. Reusable — tokens returned to pool on deallocation.',
    unit: '1 000 tokens',
  },
  {
    sku: 'IB-NIOSX-SRV-500',
    name: 'Universal DDI — Server Tokens (500-pack)',
    description: 'Consumed per NIOSXaaS instance. Token cost scales with form factor (XS 250 → XL 3 760 per member).',
    unit: '500 tokens',
  },
  {
    sku: 'IB-UDDI-RPT-40',
    name: 'Universal DDI — Reporting Tokens (40-pack)',
    description: 'Covers 10 M DNS/DHCP log events per month. Required for Threat Defense telemetry and audit trails.',
    unit: '40 tokens / 10 M events/month',
  },
  {
    sku: 'IB-TD-CORE',
    name: 'BloxOne Threat Defense — Core',
    description: 'DNS-layer security: RPZ enforcement, threat intelligence, DGA/lookalike detection. Integrates with Versa SD-WAN for secure branch DNS.',
    unit: 'Per site / per year',
  },
  {
    sku: 'IB-TD-ADVANCED',
    name: 'BloxOne Threat Defense — Advanced',
    description: 'Adds Threat Intel feeds, Lookalike Domain detection, Infoblox TIDE, Dossier, and SOC Insights on top of Core.',
    unit: 'Per site / per year',
  },
  {
    sku: 'IB-NIOSX-XS',
    name: 'NIOSXaaS — XS Form Factor (250 server tokens)',
    description: '8 vCPU / 8 GB — 681 DNS QPS @ 85% CHR. For edge/branch PoPs up to 5 sites.',
    unit: 'Per member',
  },
  {
    sku: 'IB-NIOSX-S',
    name: 'NIOSXaaS — S Form Factor (470 server tokens)',
    description: '8 vCPU / 16 GB — 2 900 DNS QPS @ 85% CHR. Small regional hub, 5–15 sites.',
    unit: 'Per member',
  },
  {
    sku: 'IB-NIOSX-M',
    name: 'NIOSXaaS — M Form Factor (940 server tokens)',
    description: '16 vCPU / 32 GB — 14 800 DNS QPS @ 85% CHR. Medium regional hub, 15–40 sites.',
    unit: 'Per member',
  },
  {
    sku: 'IB-NIOSX-L',
    name: 'NIOSXaaS — L Form Factor (1 880 server tokens)',
    description: '32 vCPU / 64 GB — 35 000 DNS QPS @ 85% CHR. Large anchor or Grid Master candidate.',
    unit: 'Per member',
  },
  {
    sku: 'IB-NIOSX-XL',
    name: 'NIOSXaaS — XL Form Factor (3 760 server tokens)',
    description: '64 vCPU / 128 GB — 70 000 DNS QPS @ 85% CHR. Global Grid Master, 100+ sites.',
    unit: 'Per member',
  },
]

// ── PoC Recommended Config ────────────────────────────────────────────────────
export const pocConfig = {
  duration: '30–45 days',
  minTokens: 2500,
  servers: [
    { role: 'Grid Master (GM)',    formFactor: 'S', cloud: 'AWS us-east-1 or customer cloud of choice' },
    { role: 'Grid Member — site 1',formFactor: 'XS', cloud: 'Customer hypervisor or AWS (closest region)' },
    { role: 'Grid Member — site 2',formFactor: 'XS', cloud: 'Customer hypervisor or AWS (second test region)' },
  ],
  scope: '2–3 branch sites + 1 hub, Versa SD-WAN integration via DNS forwarder or RPZ push',
  successCriteria: [
    'DNS resolution end-to-end over Versa IPsec tunnel < 20 ms',
    'DHCP lease provisioned within 500 ms for new branch device',
    'BloxOne Threat Defense blocking test IOC domain (EICAR DNS equivalent)',
    'IPAM auto-discovery populating host records from DHCP',
    'Infoblox logs correlated with Versa SD-WAN events in a SIEM view',
  ],
}
