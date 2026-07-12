export type QuestionCategory = "web" | "network" | "linux" | "windows" | "cloud" | "crypto" | "general";

export interface BankQuestion {
  id: string;
  type: "open" | "mcq";
  category: QuestionCategory;
  prompt: string;
  options?: string[];
  correctOption?: number;
  rubric?: string;
  keywords?: string[]; // For open-ended local grading
}

export const questionBank: BankQuestion[] = [
  // --- WEB SECURITY ---
  { id: "web_o1", type: "open", category: "web", prompt: "Explain the difference between Reflected and Stored XSS and how you would test for them.", rubric: "Must mention execution contexts, persistence, and payloads.", keywords: ["reflect", "store", "persist", "payload", "database", "url", "script"] },
  { id: "web_o2", type: "open", category: "web", prompt: "How does CSRF work, and what are the most effective ways to mitigate it?", rubric: "Mention state-changing actions, lack of authorization verification, and tokens/SameSite cookies.", keywords: ["token", "samesite", "cookie", "forge", "state", "anti-csrf"] },
  { id: "web_o3", type: "open", category: "web", prompt: "Describe a scenario where an SSRF vulnerability can lead to Remote Code Execution.", rubric: "Mention internal services, cloud metadata (AWS IMDS), and chained exploits.", keywords: ["internal", "metadata", "cloud", "aws", "imds", "chain", "service"] },
  { id: "web_m1", type: "mcq", category: "web", prompt: "Which HTTP header is primarily used to mitigate Clickjacking?", options: ["A. Content-Security-Policy", "B. X-Frame-Options", "C. Strict-Transport-Security", "D. X-XSS-Protection"], correctOption: 1 },
  { id: "web_m2", type: "mcq", category: "web", prompt: "In a SQL injection attack, what does the payload ' OR 1=1 -- typically achieve?", options: ["A. Deletes the table", "B. Bypasses authentication", "C. Encrypts the database", "D. Triggers a buffer overflow"], correctOption: 1 },
  { id: "web_m3", type: "mcq", category: "web", prompt: "Which of these is NOT a common mitigation for SQL Injection?", options: ["A. Prepared Statements", "B. Stored Procedures", "C. Parameterized Queries", "D. Base64 Encoding"], correctOption: 3 },
  { id: "web_m4", type: "mcq", category: "web", prompt: "What does CORS stand for?", options: ["A. Cross-Origin Resource Sharing", "B. Cross-Origin Request Security", "C. Content-Origin Resource System", "D. Cross-Object Remote Sharing"], correctOption: 0 },

  // --- NETWORK SECURITY ---
  { id: "net_o1", type: "open", category: "network", prompt: "Explain the TCP 3-way handshake and how a SYN flood attack manipulates it.", rubric: "Must mention SYN, SYN-ACK, ACK, and resource exhaustion.", keywords: ["syn", "ack", "handshake", "exhaustion", "resource", "half-open"] },
  { id: "net_o2", type: "open", category: "network", prompt: "What is ARP Spoofing and how can an attacker use it to perform a Man-in-the-Middle attack?", rubric: "Mention MAC address mapping, broadcasting false ARP replies, and intercepting traffic.", keywords: ["mac", "address", "broadcast", "intercept", "mitm", "table", "poison"] },
  { id: "net_m1", type: "mcq", category: "network", prompt: "Which layer of the OSI model does a standard network router operate on?", options: ["A. Layer 2 (Data Link)", "B. Layer 3 (Network)", "C. Layer 4 (Transport)", "D. Layer 7 (Application)"], correctOption: 1 },
  { id: "net_m2", type: "mcq", category: "network", prompt: "Which protocol is used to securely manage network devices over an encrypted channel?", options: ["A. Telnet", "B. SSH", "C. SNMPv1", "D. FTP"], correctOption: 1 },
  { id: "net_m3", type: "mcq", category: "network", prompt: "What is the default port for HTTPS?", options: ["A. 80", "B. 443", "C. 8443", "D. 22"], correctOption: 1 },
  { id: "net_m4", type: "mcq", category: "network", prompt: "Which type of firewall inspects the state and context of active connections?", options: ["A. Packet Filtering", "B. Stateful Inspection", "C. Proxy Firewall", "D. WAF"], correctOption: 1 },

  // --- LINUX/SYSTEMS ---
  { id: "lin_o1", type: "open", category: "linux", prompt: "Explain the concept of SUID in Linux and how it can be exploited for privilege escalation.", rubric: "Mention execute permissions, running as owner, and exploiting vulnerable binaries.", keywords: ["execute", "owner", "root", "binary", "privilege", "escalation", "vulnerable"] },
  { id: "lin_o2", type: "open", category: "linux", prompt: "Describe the purpose of the /etc/shadow file and the risks if it is world-readable.", rubric: "Mention password hashes, salt, and offline cracking.", keywords: ["hash", "password", "crack", "salt", "offline", "shadow"] },
  { id: "lin_m1", type: "mcq", category: "linux", prompt: "Which command is used to change file permissions in Linux?", options: ["A. chown", "B. chmod", "C. chgrp", "D. passwd"], correctOption: 1 },
  { id: "lin_m2", type: "mcq", category: "linux", prompt: "What does the 'grep' command do?", options: ["A. Searches for patterns in files", "B. Compresses files", "C. Manages network interfaces", "D. Lists directory contents"], correctOption: 0 },
  { id: "lin_m3", type: "mcq", category: "linux", prompt: "In Linux, which directory typically contains system configuration files?", options: ["A. /var", "B. /bin", "C. /etc", "D. /home"], correctOption: 2 },
  { id: "lin_m4", type: "mcq", category: "linux", prompt: "Which command shows the current running processes and their resource usage in real-time?", options: ["A. ps", "B. top", "C. netstat", "D. ls"], correctOption: 1 },

  // --- WINDOWS/AD ---
  { id: "win_o1", type: "open", category: "windows", prompt: "Explain how Pass-the-Hash works in an Active Directory environment.", rubric: "Mention NTLM hashes, bypassing plaintext passwords, and lateral movement.", keywords: ["ntlm", "hash", "plaintext", "lateral", "movement", "authenticate"] },
  { id: "win_o2", type: "open", category: "windows", prompt: "What is Kerberoasting and how can a defender detect or prevent it?", rubric: "Mention requesting TGS tickets, SPNs, offline cracking, and strong service account passwords.", keywords: ["tgs", "spn", "ticket", "crack", "offline", "service", "account"] },
  { id: "win_m1", type: "mcq", category: "windows", prompt: "Which protocol is primarily used by Active Directory for authentication?", options: ["A. NTLM", "B. Kerberos", "C. LDAP", "D. RADIUS"], correctOption: 1 },
  { id: "win_m2", type: "mcq", category: "windows", prompt: "What is the default port for RDP (Remote Desktop Protocol)?", options: ["A. 3389", "B. 22", "C. 445", "D. 139"], correctOption: 0 },
  { id: "win_m3", type: "mcq", category: "windows", prompt: "Which Windows tool is often abused to execute scripts and commands remotely in a stealthy manner?", options: ["A. Command Prompt", "B. PowerShell", "C. Task Manager", "D. Event Viewer"], correctOption: 1 },

  // --- CLOUD SECURITY ---
  { id: "cld_o1", type: "open", category: "cloud", prompt: "What is an overly permissive IAM role, and how can it lead to a cloud compromise?", rubric: "Mention least privilege, wildcard permissions, and privilege escalation.", keywords: ["privilege", "wildcard", "escalation", "least", "access", "policy"] },
  { id: "cld_m1", type: "mcq", category: "cloud", prompt: "Which AWS service is commonly misconfigured, leading to public data leaks?", options: ["A. EC2", "B. S3", "C. RDS", "D. Lambda"], correctOption: 1 },
  { id: "cld_m2", type: "mcq", category: "cloud", prompt: "What is the primary principle of Cloud Security Posture Management (CSPM)?", options: ["A. Encrypting all data", "B. Monitoring and correcting misconfigurations", "C. Writing secure code", "D. Managing physical data center access"], correctOption: 1 },

  // --- CRYPTOGRAPHY ---
  { id: "cry_o1", type: "open", category: "crypto", prompt: "Explain the difference between symmetric and asymmetric encryption.", rubric: "Mention shared keys vs public/private key pairs and performance differences.", keywords: ["shared", "public", "private", "pair", "key", "performance", "speed"] },
  { id: "cry_m1", type: "mcq", category: "crypto", prompt: "Which of the following is a hashing algorithm, not an encryption algorithm?", options: ["A. AES", "B. RSA", "C. SHA-256", "D. DES"], correctOption: 2 },
  { id: "cry_m2", type: "mcq", category: "crypto", prompt: "What is the purpose of adding a 'salt' to a password hash?", options: ["A. To make the hash shorter", "B. To prevent rainbow table attacks", "C. To encrypt the password", "D. To make the password easier to remember"], correctOption: 1 },

  // --- GENERAL/FOUNDATIONAL ---
  { id: "gen_o1", type: "open", category: "general", prompt: "Describe your methodology when approaching a new target for a penetration test.", rubric: "Mention recon/OSINT, scanning, enumeration, exploitation, and reporting.", keywords: ["recon", "osint", "scan", "enumerate", "exploit", "report", "methodology"] },
  { id: "gen_o2", type: "open", category: "general", prompt: "What is the principle of 'Least Privilege'?", rubric: "Mention giving users only the access they strictly need to perform their jobs.", keywords: ["access", "need", "job", "minimum", "restrict", "permission"] },
  { id: "gen_m1", type: "mcq", category: "general", prompt: "What does the 'C' in the CIA triad stand for?", options: ["A. Control", "B. Confidentiality", "C. Compliance", "D. Connectivity"], correctOption: 1 },
  { id: "gen_m2", type: "mcq", category: "general", prompt: "Which of these is an example of Social Engineering?", options: ["A. SQL Injection", "B. Buffer Overflow", "C. Phishing", "D. Port Scanning"], correctOption: 2 },
  { id: "gen_m3", type: "mcq", category: "general", prompt: "What is a 'Zero-Day' vulnerability?", options: ["A. A vulnerability that takes zero days to fix", "B. An unknown vulnerability with no patch available", "C. A vulnerability found on the first day of testing", "D. A feature that acts like a vulnerability"], correctOption: 1 },
  { id: "gen_m4", type: "mcq", category: "general", prompt: "Which document defines the rules of engagement and scope for a penetration test?", options: ["A. Non-Disclosure Agreement (NDA)", "B. Statement of Work (SOW) / Rules of Engagement (RoE)", "C. Penetration Test Report", "D. Service Level Agreement (SLA)"], correctOption: 1 },
  { id: "gen_m5", type: "mcq", category: "general", prompt: "What is the main goal of a Red Team engagement compared to a standard Penetration Test?", options: ["A. Find as many vulnerabilities as possible", "B. Test the organization's detection and response capabilities", "C. Verify compliance with PCI-DSS", "D. Scan external IP addresses"], correctOption: 1 }
];
