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

// ═══════════════════════════════════════════════════════════════════════════════
//  TOKEN OPERATIONAL MOCK DATA
//  All figures are illustrative mock data for demo purposes.
//  They reflect a plausible steady-state for the 87-device Versa environment
//  described in demoEnv and are internally consistent with calculateTokens().
// ═══════════════════════════════════════════════════════════════════════════════

// ── Token Pool — Current Status ───────────────────────────────────────────────
// "Purchased" = tokens bought at contract start.
// "Allocated" = tokens currently bound to active services.
// "Consumed"  = 3-month rolling average of peak 5-min utilisation (Infoblox metric).
// "Available" = purchased − allocated (reusable pool, not spent).
export const tokenPool = {
  contractStart:  '2025-05-01',
  contractExpiry: '2027-04-30',
  asOf: '2026-04-27',
  purchased: 8_000,
  allocated: 7_200,
  available:   800,
  utilizationPct: 90,
  categories: {
    management: {
      purchased: 2_000,
      allocated: 1_680,
      consumed:  1_680,  // rolling avg; grows as new devices come online
      utilizationPct: 84,
      drivers: {
        activeManagedIPs:    4_200,   // ~73 % of 5 775 theoretical max (some offline/unregistered)
        ipamHostRecords:     4_200,
        dhcpNetworkScopes:     192,
        dnsZones:              261,
        totalIpamObjects:    4_653,
      },
    },
    server: {
      purchased: 4_500,
      allocated: 4_320,
      consumed:  4_320,  // static — server deployment is fixed at any given time
      utilizationPct: 96,
      deployedMembers: 12,   // 2 HA members × 6 regions
      formFactorBreakdown: { XS: 6, S: 6, M: 0, L: 0, XL: 0 },
    },
    reporting: {
      purchased:  880,
      allocated:  760,
      consumed:   760,
      utilizationPct: 86,
      monthlyLogEvents: 196_000_000,  // actual; 222 M was peak estimate
      logEventPer10M: 40,
    },
  },
}

// ── Monthly Token Consumption — 6-Month Trend ────────────────────────────────
// Server tokens are flat (fixed deployment). Management grows as devices onboard.
// Reporting grows slightly as log volume increases with new sites.
export const tokenHistory = [
  { month: 'Nov 2025', management: 1_440, server: 4_320, reporting: 640, total: 6_400,  newDevices: 0,  notes: 'Steady state after initial rollout' },
  { month: 'Dec 2025', management: 1_480, server: 4_320, reporting: 640, total: 6_440,  newDevices: 2,  notes: '2 new APAC branches onboarded' },
  { month: 'Jan 2026', management: 1_520, server: 4_320, reporting: 680, total: 6_520,  newDevices: 3,  notes: '3 new EMEA branches; reporting volume up (Threat Defense enabled on EU sites)' },
  { month: 'Feb 2026', management: 1_580, server: 4_320, reporting: 720, total: 6_620,  newDevices: 3,  notes: '3 new LatAm branches; IPAM auto-discovery enabled on NA region' },
  { month: 'Mar 2026', management: 1_640, server: 4_320, reporting: 760, total: 6_720,  newDevices: 2,  notes: '2 new ME branches; DDNS updates increasing managed IP count' },
  { month: 'Apr 2026', management: 1_680, server: 4_320, reporting: 760, total: 6_760,  newDevices: 0,  notes: 'No new onboarding; management tokens stabilised' },
]

// ── Per-Region Token Allocation ───────────────────────────────────────────────
// Management tokens are apportioned by managed IP count per region.
// Server tokens are the actual form-factor cost × HA pair.
// Reporting tokens are apportioned by log volume per region.
export const regionTokenAllocation = {
  'North America': {
    managementTokens: 500, serverTokens: 940, reportingTokens: 200, total: 1_640,
    managedIPs: 1_650, logEventsPerMonth: '52 M',
    niosxDeployment: '2 × S @ AWS us-east-1',
    utilizationPct: { management: 83, server: 96, reporting: 82 },
    trend: 'growing',     // management tokens growing due to APAC handoff migrations
  },
  'Europe': {
    managementTokens: 420, serverTokens: 940, reportingTokens: 200, total: 1_560,
    managedIPs: 1_400, logEventsPerMonth: '44 M',
    niosxDeployment: '2 × S @ AWS eu-central-1',
    utilizationPct: { management: 84, server: 96, reporting: 90 },
    trend: 'growing',     // Threat Defense newly enabled — reporting rising
  },
  'Asia-Pacific': {
    managementTokens: 460, serverTokens: 940, reportingTokens: 200, total: 1_600,
    managedIPs: 1_540, logEventsPerMonth: '50 M',
    niosxDeployment: '2 × S @ AWS ap-southeast-1',
    utilizationPct: { management: 92, server: 96, reporting: 89 },
    trend: 'growing',     // highest growth region — approaching management threshold
  },
  'Middle East': {
    managementTokens: 160, serverTokens: 500, reportingTokens:  80, total:   740,
    managedIPs:   530, logEventsPerMonth: '17 M',
    niosxDeployment: '2 × XS @ AWS me-central-1',
    utilizationPct: { management: 80, server: 90, reporting: 68 },
    trend: 'stable',
  },
  'Latin America': {
    managementTokens: 140, serverTokens: 500, reportingTokens:  40, total:   680,
    managedIPs:   470, logEventsPerMonth: '16 M',
    niosxDeployment: '2 × XS @ AWS sa-east-1',
    utilizationPct: { management: 70, server: 90, reporting: 50 },
    trend: 'stable',
  },
  'Africa': {
    managementTokens: 120, serverTokens: 500, reportingTokens:  40, total:   660,
    managedIPs:   400, logEventsPerMonth: '13 M',
    niosxDeployment: '2 × XS @ AWS af-south-1',
    utilizationPct: { management: 60, server: 80, reporting: 40 },
    trend: 'stable',     // NBO-Branch-01 offline — reducing managed IP count
  },
}

// ── Token Consumption Drivers — What consumes each token type ────────────────
// Rates marked ESTIMATED where not officially published.
export const tokenDrivers = {
  management: {
    description: 'Allocated based on active IP addresses and DDI object counts (per Infoblox FAQs)',
    drivers: [
      { driver: 'Active managed IP address',  rate: '~0.2 tokens/IP',     basis: 'Estimated (B1) — 1 token per 5 IPs',       example: '4 200 IPs × 0.2 = 840 raw tokens' },
      { driver: 'IPAM host record',            rate: '~0.05 tokens/record', basis: 'Estimated — part of DDI object count',     example: '4 200 records × 0.05 = 210 tokens' },
      { driver: 'DHCP network scope',          rate: '~0.5 tokens/scope',   basis: 'Estimated',                                example: '192 scopes × 0.5 = 96 tokens' },
      { driver: 'DNS zone (forward/reverse)',  rate: '~1.0 tokens/zone',    basis: 'Estimated',                                example: '261 zones × 1.0 = 261 tokens' },
    ],
    total_raw_demo: 1_407,
    total_purchased_demo: 2_000,
    note: 'Per-object token rates are pre-sales estimates. Infoblox does not publish per-object granularity publicly.',
  },
  server: {
    description: 'Fixed allocation per NIOSXaaS member based on form factor. Tokens returned to pool if member is decommissioned.',
    drivers: [
      { driver: 'XS member (8 vCPU / 8 GB)',    rate: '250 tokens/member', basis: 'Confirmed',  example: '6 × XS = 1 500 tokens' },
      { driver: 'S member (8 vCPU / 16 GB)',     rate: '470 tokens/member', basis: 'Confirmed',  example: '6 × S  = 2 820 tokens' },
      { driver: 'M member (16 vCPU / 32 GB)',    rate: '940 tokens/member', basis: 'Confirmed',  example: '2 × M  = 1 880 tokens (not deployed in this env)' },
      { driver: 'L member (32 vCPU / 64 GB)',    rate: '1 880 tokens/member',basis: 'Confirmed', example: 'Not deployed' },
      { driver: 'XL member (64 vCPU / 128 GB)', rate: '3 760 tokens/member',basis: 'Confirmed', example: 'Not deployed' },
    ],
    total_deployed_demo: 4_320,   // 6 × XS (1 500) + 6 × S (2 820)
    total_purchased_demo: 4_500,
  },
  reporting: {
    description: 'Consumed per 10 M log/event records per month (DNS queries, DHCP events, audit logs).',
    drivers: [
      { driver: 'DNS query log (recursive)',   rate: '40 tokens / 10 M events/month', basis: 'Confirmed', example: 'NA region: 52 M events → 5 × 40 = 200 tokens' },
      { driver: 'DHCP lease/renew/release',    rate: 'Counted in same pool',          basis: 'Confirmed', example: 'Included in total event volume' },
      { driver: 'Threat Defense telemetry',    rate: 'Counted in same pool',          basis: 'Confirmed', example: 'BloxOne TD events add ~8–15 % to log volume' },
      { driver: 'IPAM audit trail events',     rate: 'Counted in same pool',          basis: 'Confirmed', example: 'Low volume; < 1 % of total' },
    ],
    total_raw_demo: 784,
    total_purchased_demo: 880,
    note: 'Reporting token measurement uses highest 5-min peak per month with 3-month rolling average.',
  },
}

// ── Token Alerts ──────────────────────────────────────────────────────────────
export const tokenAlerts = [
  {
    id: 'ta-01',
    severity: 'warning',
    region: 'North America',
    category: 'server',
    title: 'NA server token utilisation at 96% — near auto-escalation',
    detail: 'NY-Hub-01 peak QPS has grown 22% over 3 months (810 → 990 QPS). Current S form factor capacity is 2 900 QPS; headroom shrinking. If trend continues, Infoblox will auto-escalate to M form factor, adding 470 server tokens per member (940 extra total for the HA pair).',
    action: 'Upgrade NA pair from S → M (+940 server tokens) before auto-escalation triggers unexpectedly.',
    tokenImpact: '+940 server tokens',
    urgency: 'Resolve within 30 days',
  },
  {
    id: 'ta-02',
    severity: 'warning',
    region: 'Asia-Pacific',
    category: 'management',
    title: 'APAC management token utilisation at 92% — approaching pack limit',
    detail: '12 new APAC branch devices onboarded in Q1 2026. At current growth rate of 4 new devices/month, the 2 000-token management pack will be exhausted in approximately 8 months. Each new device adds ~10 managed IPs → ~2 management tokens.',
    action: 'Plan 1 additional management token pack (1 000 tokens) at mid-year renewal or expansion order.',
    tokenImpact: '+1 000 management tokens at renewal',
    urgency: 'Plan within 90 days',
  },
  {
    id: 'ta-03',
    severity: 'info',
    region: 'Europe',
    category: 'reporting',
    title: 'EU reporting tokens at 90% — Threat Defense enablement driving growth',
    detail: 'BloxOne Threat Defense was enabled on all 18 EU sites in Jan 2026. DNS security telemetry added ~18 M events/month, pushing EU from 26 M → 44 M events/month. Currently within purchased pack, but a further 5 EU sites would exceed current 880-token reporting pack.',
    action: 'Purchase 1 additional reporting pack (40 tokens) before next EU site rollout.',
    tokenImpact: '+40 reporting tokens',
    urgency: 'Monitor; action before next EU expansion',
  },
  {
    id: 'ta-04',
    severity: 'info',
    region: 'Africa',
    category: 'reporting',
    title: 'Africa reporting tokens underutilised — 40% consumed',
    detail: 'NBO-Branch-01 (offline) and lower endpoint density in Africa mean only 13 M events/month vs 20 M budgeted. 24 reporting tokens are effectively idle in this region.',
    action: 'Consider redistributing 40 reporting tokens from Africa to Europe at next renewal to better match consumption patterns.',
    tokenImpact: 'Rebalance 40 tokens Africa → Europe',
    urgency: 'Optimise at next renewal (Apr 2027)',
  },
  {
    id: 'ta-05',
    severity: 'info',
    region: 'Latin America',
    category: 'management',
    title: 'LatAm management token utilisation low at 70%',
    detail: 'Buenos Aires (BUE-Branch-01) and Mexico City (MEX-Branch-02) are in warning state, reducing active managed IP count below forecast. Recovery of these sites will add ~100 managed IPs (+20 tokens).',
    action: 'Restore warning-state sites; no additional token purchase required.',
    tokenImpact: 'No additional tokens needed',
    urgency: 'Informational',
  },
]

// ── Token Renewal Forecast ────────────────────────────────────────────────────
export const tokenForecast = {
  contractExpiry: '2027-04-30',
  monthsRemaining: 12,
  currentMonthlyBurn: 6_760,    // Apr 2026 actuals
  growthRatePctPerMonth: 1.2,   // 3-month trailing average growth rate
  projectedBurnAtRenewal: 7_760, // extrapolated 12 months forward at 1.2%/month
  purchasedTokens: 8_000,
  projectedShortfall: 0,         // within purchased pack — no shortfall at current growth
  renewalRecommendation: {
    management: { current: 2_000, recommended: 3_000, delta: '+1 000', reason: 'APAC growth (+4 devices/month) will exceed current pack in ~8 months; buffer for planned expansions' },
    server:     { current: 4_500, recommended: 5_440, delta: '+940',   reason: 'NA pair auto-escalation from S→M anticipated within 30 days' },
    reporting:  { current:   880, recommended: 1_000, delta: '+120',   reason: 'EU Threat Defense growth; 3 additional 40-token packs for headroom' },
    total:      { current: 8_000, recommended: 9_440, delta: '+1 440', estimatedAnnualTokenCost: 'Contact Infoblox for current token pricing' },
  },
  notes: [
    'Management and reporting tokens are reusable (returned to pool on deallocation).',
    'Server tokens are reusable when NIOSXaaS members are decommissioned.',
    'Growth rate of 1.2%/month based on 6-month trailing average (Nov 2025–Apr 2026).',
    'Forecast assumes no major new regional deployments beyond current plan.',
  ],
}
