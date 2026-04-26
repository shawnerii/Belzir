export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'triaged' | 'escalated' | 'ignored';
export type TriageDecision = 'true_positive' | 'false_positive' | 'ignore' | 'escalate';
export type IncidentStatus = 'open' | 'investigating' | 'closed';

type AlertPayload = {
  manager: { name: string; id: string };
  agent: { id: string; name: string; ip: string };
  rule: { id: string; level: number; description: string };
  decoder: { name: string };
  data: Record<string, string | number>;
  location: string;
};

function rawPayload(payload: AlertPayload): string {
  return JSON.stringify(payload);
}

export type AlertSeedRow = {
  id: string;
  received_at: string;
  severity: AlertSeverity;
  rule_id: string;
  rule_name: string;
  host: string;
  ip: string;
  status: AlertStatus;
  raw_json: string;
  created_at: string;
  updated_at: string;
};

export const alertSeedRows: AlertSeedRow[] = [
  {
    id: 'alert-001',
    received_at: '2026-04-25T08:10:00Z',
    severity: 'high',
    rule_id: '5710',
    rule_name: 'SSH authentication failure burst',
    host: 'web-01',
    ip: '10.20.1.14',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '001', name: 'web-01', ip: '10.20.1.14' },
      rule: { id: '5710', level: 10, description: 'Multiple failed SSH login attempts' },
      decoder: { name: 'sshd' },
      data: { srcip: '185.199.111.153', dstuser: 'root', attempts: 12 },
      location: '/var/log/auth.log',
    }),
    created_at: '2026-04-25T08:10:00Z',
    updated_at: '2026-04-25T08:10:00Z',
  },
  {
    id: 'alert-002',
    received_at: '2026-04-25T08:22:00Z',
    severity: 'medium',
    rule_id: '5712',
    rule_name: 'SSH login succeeded after failures',
    host: 'web-01',
    ip: '10.20.1.14',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '001', name: 'web-01', ip: '10.20.1.14' },
      rule: { id: '5712', level: 7, description: 'SSH login success after multiple failures' },
      decoder: { name: 'sshd' },
      data: { srcip: '185.199.111.153', dstuser: 'deploy', attempts_before_success: 5 },
      location: '/var/log/auth.log',
    }),
    created_at: '2026-04-25T08:22:00Z',
    updated_at: '2026-04-25T08:22:00Z',
  },
  {
    id: 'alert-003',
    received_at: '2026-04-25T09:01:00Z',
    severity: 'critical',
    rule_id: '92101',
    rule_name: 'Command and control traffic candidate',
    host: 'proxy-01',
    ip: '10.20.3.18',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '014', name: 'proxy-01', ip: '10.20.3.18' },
      rule: { id: '92101', level: 14, description: 'Known C2 domain request observed' },
      decoder: { name: 'suricata' },
      data: { srcip: '10.20.3.18', dstip: '45.129.14.99', domain: 'sync-updates-node.net' },
      location: '/var/log/suricata/eve.json',
    }),
    created_at: '2026-04-25T09:01:00Z',
    updated_at: '2026-04-25T09:01:00Z',
  },
  {
    id: 'alert-004',
    received_at: '2026-04-25T09:26:00Z',
    severity: 'low',
    rule_id: '550',
    rule_name: 'File added in monitored directory',
    host: 'db-01',
    ip: '10.20.2.25',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '009', name: 'db-01', ip: '10.20.2.25' },
      rule: { id: '550', level: 3, description: 'File added to monitored path' },
      decoder: { name: 'syscheck' },
      data: { file: '/etc/cron.d/backup', sha256: '9111f8ed7da72d' },
      location: 'syscheck',
    }),
    created_at: '2026-04-25T09:26:00Z',
    updated_at: '2026-04-25T09:26:00Z',
  },
  {
    id: 'alert-005',
    received_at: '2026-04-25T10:05:00Z',
    severity: 'high',
    rule_id: '93310',
    rule_name: 'Privilege escalation binary execution',
    host: 'ws-07',
    ip: '10.20.9.77',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '033', name: 'ws-07', ip: '10.20.9.77' },
      rule: { id: '93310', level: 11, description: 'Suspicious sudo command execution' },
      decoder: { name: 'auditd' },
      data: { user: 'intern', command: '/usr/bin/nmap -sS 10.20.2.0/24', tty: 'pts/2' },
      location: '/var/log/audit/audit.log',
    }),
    created_at: '2026-04-25T10:05:00Z',
    updated_at: '2026-04-25T10:05:00Z',
  },
  {
    id: 'alert-006',
    received_at: '2026-04-25T10:27:00Z',
    severity: 'medium',
    rule_id: '5762',
    rule_name: 'User account added to sudoers',
    host: 'db-01',
    ip: '10.20.2.25',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '009', name: 'db-01', ip: '10.20.2.25' },
      rule: { id: '5762', level: 9, description: 'Sudoers file changed' },
      decoder: { name: 'auditd' },
      data: { actor: 'root', target_user: 'backup', file: '/etc/sudoers' },
      location: '/var/log/audit/audit.log',
    }),
    created_at: '2026-04-25T10:27:00Z',
    updated_at: '2026-04-25T10:27:00Z',
  },
  {
    id: 'alert-007',
    received_at: '2026-04-25T11:03:00Z',
    severity: 'medium',
    rule_id: '31545',
    rule_name: 'Large outbound transfer',
    host: 'proxy-01',
    ip: '10.20.3.18',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '014', name: 'proxy-01', ip: '10.20.3.18' },
      rule: { id: '31545', level: 8, description: 'Abnormal outbound traffic volume' },
      decoder: { name: 'netflow' },
      data: { srcip: '10.20.3.18', dstip: '104.26.0.12', bytes_out: 874321921 },
      location: '/var/log/netflow.log',
    }),
    created_at: '2026-04-25T11:03:00Z',
    updated_at: '2026-04-25T11:03:00Z',
  },
  {
    id: 'alert-008',
    received_at: '2026-04-25T11:34:00Z',
    severity: 'low',
    rule_id: '1002',
    rule_name: 'Service restart detected',
    host: 'web-02',
    ip: '10.20.1.15',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '002', name: 'web-02', ip: '10.20.1.15' },
      rule: { id: '1002', level: 4, description: 'Service restart event' },
      decoder: { name: 'journald' },
      data: { service: 'nginx', action: 'restart' },
      location: '/var/log/syslog',
    }),
    created_at: '2026-04-25T11:34:00Z',
    updated_at: '2026-04-25T11:34:00Z',
  },
  {
    id: 'alert-009',
    received_at: '2026-04-25T12:02:00Z',
    severity: 'medium',
    rule_id: '31151',
    rule_name: 'Brute-force web login pattern',
    host: 'web-02',
    ip: '10.20.1.15',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '002', name: 'web-02', ip: '10.20.1.15' },
      rule: { id: '31151', level: 8, description: 'Web login brute-force candidate' },
      decoder: { name: 'nginx' },
      data: { srcip: '91.203.5.21', endpoint: '/login', attempts: 34 },
      location: '/var/log/nginx/access.log',
    }),
    created_at: '2026-04-25T12:02:00Z',
    updated_at: '2026-04-25T12:02:00Z',
  },
  {
    id: 'alert-010',
    received_at: '2026-04-25T13:18:00Z',
    severity: 'high',
    rule_id: '91513',
    rule_name: 'Malicious script dropper hash match',
    host: 'ws-07',
    ip: '10.20.9.77',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '033', name: 'ws-07', ip: '10.20.9.77' },
      rule: { id: '91513', level: 12, description: 'Known malicious hash detected' },
      decoder: { name: 'syscheck' },
      data: { file: '/tmp/install.sh', sha256: 'f3ae7b194e0d9d6f25' },
      location: 'syscheck',
    }),
    created_at: '2026-04-25T13:18:00Z',
    updated_at: '2026-04-25T13:18:00Z',
  },
  {
    id: 'alert-011',
    received_at: '2026-04-25T14:01:00Z',
    severity: 'critical',
    rule_id: '92653',
    rule_name: 'Ransomware extension activity burst',
    host: 'files-01',
    ip: '10.20.4.12',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '021', name: 'files-01', ip: '10.20.4.12' },
      rule: { id: '92653', level: 15, description: 'Rapid suspicious file extension changes' },
      decoder: { name: 'syscheck' },
      data: { path: '/srv/shared', changed_files: 412, extension: '.lockbit' },
      location: 'syscheck',
    }),
    created_at: '2026-04-25T14:01:00Z',
    updated_at: '2026-04-25T14:01:00Z',
  },
  {
    id: 'alert-012',
    received_at: '2026-04-26T07:42:00Z',
    severity: 'low',
    rule_id: '18107',
    rule_name: 'USB storage insertion',
    host: 'ws-12',
    ip: '10.20.9.88',
    status: 'new',
    raw_json: rawPayload({
      manager: { name: 'wazuh-manager', id: '000' },
      agent: { id: '044', name: 'ws-12', ip: '10.20.9.88' },
      rule: { id: '18107', level: 3, description: 'Removable storage connected' },
      decoder: { name: 'udev' },
      data: { user: 'analyst1', vendor: 'Kingston', serial: 'ABC443993' },
      location: '/var/log/kern.log',
    }),
    created_at: '2026-04-26T07:42:00Z',
    updated_at: '2026-04-26T07:42:00Z',
  },
];

export type IncidentSeedRow = {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
};

export const incidentSeedRows: IncidentSeedRow[] = [
  {
    id: 'incident-001',
    title: 'Credential Access Investigation',
    severity: 'high',
    status: 'investigating',
    created_at: '2026-04-25T08:45:00Z',
    updated_at: '2026-04-25T09:22:00Z',
  },
  {
    id: 'incident-002',
    title: 'Outbound Traffic Anomaly',
    severity: 'medium',
    status: 'open',
    created_at: '2026-04-25T11:10:00Z',
    updated_at: '2026-04-25T11:16:00Z',
  },
];

export type IncidentAlertLinkSeedRow = {
  id: string;
  incident_id: string;
  alert_id: string;
  linked_at: string;
};

export const incidentAlertLinkSeedRows: IncidentAlertLinkSeedRow[] = [
  {
    id: 'link-001',
    incident_id: 'incident-001',
    alert_id: 'alert-001',
    linked_at: '2026-04-25T08:46:00Z',
  },
  {
    id: 'link-002',
    incident_id: 'incident-001',
    alert_id: 'alert-003',
    linked_at: '2026-04-25T09:05:00Z',
  },
  {
    id: 'link-003',
    incident_id: 'incident-002',
    alert_id: 'alert-007',
    linked_at: '2026-04-25T11:11:00Z',
  },
];

export type IncidentCommentSeedRow = {
  id: string;
  incident_id: string;
  author: string;
  body: string;
  created_at: string;
};

export const incidentCommentSeedRows: IncidentCommentSeedRow[] = [
  {
    id: 'comment-001',
    incident_id: 'incident-001',
    author: 'analyst1',
    body: 'Escalated to incident after repeated SSH failures and C2 indicator.',
    created_at: '2026-04-25T09:06:00Z',
  },
  {
    id: 'comment-002',
    incident_id: 'incident-001',
    author: 'analyst2',
    body: 'Requested host isolation for proxy-01 while memory capture is scheduled.',
    created_at: '2026-04-25T09:18:00Z',
  },
  {
    id: 'comment-003',
    incident_id: 'incident-002',
    author: 'analyst1',
    body: 'Monitoring outbound destination; no confirmed exfiltration yet.',
    created_at: '2026-04-25T11:14:00Z',
  },
];

export type TriageDecisionSeedRow = {
  id: string;
  alert_id: string;
  decision: TriageDecision;
  note: string;
  decided_by: string;
  decided_at: string;
  created_at: string;
  updated_at: string;
};

export const triageDecisionSeedRows: TriageDecisionSeedRow[] = [
  {
    id: 'decision-001',
    alert_id: 'alert-001',
    decision: 'true_positive',
    note: 'Credential spray pattern confirmed by correlated source IP behavior.',
    decided_by: 'analyst1',
    decided_at: '2026-04-25T08:40:00Z',
    created_at: '2026-04-25T08:40:00Z',
    updated_at: '2026-04-25T08:40:00Z',
  },
  {
    id: 'decision-002',
    alert_id: 'alert-002',
    decision: 'false_positive',
    note: 'Expected deployment script login behavior after maintenance window.',
    decided_by: 'analyst2',
    decided_at: '2026-04-25T08:59:00Z',
    created_at: '2026-04-25T08:59:00Z',
    updated_at: '2026-04-25T08:59:00Z',
  },
  {
    id: 'decision-003',
    alert_id: 'alert-003',
    decision: 'escalate',
    note: 'C2 signature confidence high; incident linkage required.',
    decided_by: 'analyst1',
    decided_at: '2026-04-25T09:07:00Z',
    created_at: '2026-04-25T09:07:00Z',
    updated_at: '2026-04-25T09:07:00Z',
  },
  {
    id: 'decision-004',
    alert_id: 'alert-009',
    decision: 'ignore',
    note: 'Traffic pattern from internal load test; no malicious indicators found.',
    decided_by: 'analyst3',
    decided_at: '2026-04-25T12:20:00Z',
    created_at: '2026-04-25T12:20:00Z',
    updated_at: '2026-04-25T12:20:00Z',
  },
];

export type AlertStatusMaterialization = {
  alert_id: string;
  status: Exclude<AlertStatus, 'new'>;
  updated_at: string;
};

// alerts.status is a materialized current-state field for queue filtering.
// triage_decisions remains append-only audit history.
// canonical decision-to-status mapping:
// true_positive -> triaged
// false_positive -> triaged
// escalate -> escalated
// ignore -> ignored
export const alertStatusMaterialization: AlertStatusMaterialization[] = [
  {
    alert_id: 'alert-001',
    status: 'triaged',
    updated_at: '2026-04-25T08:40:00Z',
  },
  {
    alert_id: 'alert-002',
    status: 'triaged',
    updated_at: '2026-04-25T08:59:00Z',
  },
  {
    alert_id: 'alert-003',
    status: 'escalated',
    updated_at: '2026-04-25T09:07:00Z',
  },
  {
    alert_id: 'alert-009',
    status: 'ignored',
    updated_at: '2026-04-25T12:20:00Z',
  },
];
