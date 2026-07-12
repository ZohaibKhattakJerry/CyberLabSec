export type QuestionCategory = "web" | "network" | "linux" | "windows" | "cloud" | "crypto" | "soc_ir" | "malware" | "compliance" | "general";

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
  { id: "web_o3", type: "open", category: "web", prompt: "Describe a scenario where an SSRF vulnerability can lead to Remote Code Execution.", rubric: "Mention internal services, cloud metadata (AWS IMDS), and chained exploits.", keywords: ["internal", "metadata", "cloud", "aws", "imds", "chain", "service", "ssrf"] },
  { id: "web_o4", type: "open", category: "web", prompt: "Explain how a blind SQL injection differs from a regular SQL injection.", rubric: "Mention lack of direct output, boolean or time-based inference, and automated tools like sqlmap.", keywords: ["blind", "time", "boolean", "infer", "output", "error", "delay"] },
  { id: "web_o5", type: "open", category: "web", prompt: "What are Insecure Direct Object References (IDOR) and how do you prevent them?", rubric: "Mention manipulating parameters/IDs, lack of authorization checks, and access control matrices.", keywords: ["parameter", "id", "authorization", "access control", "reference", "manipulate"] },
  { id: "web_m1", type: "mcq", category: "web", prompt: "Which HTTP header is primarily used to mitigate Clickjacking?", options: ["A. Content-Security-Policy", "B. X-Frame-Options", "C. Strict-Transport-Security", "D. X-XSS-Protection"], correctOption: 1 },
  { id: "web_m2", type: "mcq", category: "web", prompt: "In a SQL injection attack, what does the payload ' OR 1=1 -- typically achieve?", options: ["A. Deletes the table", "B. Bypasses authentication", "C. Encrypts the database", "D. Triggers a buffer overflow"], correctOption: 1 },
  { id: "web_m3", type: "mcq", category: "web", prompt: "Which of these is NOT a common mitigation for SQL Injection?", options: ["A. Prepared Statements", "B. Stored Procedures", "C. Parameterized Queries", "D. Base64 Encoding"], correctOption: 3 },
  { id: "web_m4", type: "mcq", category: "web", prompt: "What does CORS stand for?", options: ["A. Cross-Origin Resource Sharing", "B. Cross-Origin Request Security", "C. Content-Origin Resource System", "D. Cross-Object Remote Sharing"], correctOption: 0 },
  { id: "web_m5", type: "mcq", category: "web", prompt: "Which of the following is used to prevent Man-in-the-Middle attacks by enforcing HTTPS?", options: ["A. CORS", "B. HSTS", "C. CSRF Tokens", "D. X-Frame-Options"], correctOption: 1 },

  // --- NETWORK SECURITY ---
  { id: "net_o1", type: "open", category: "network", prompt: "Explain the TCP 3-way handshake and how a SYN flood attack manipulates it.", rubric: "Must mention SYN, SYN-ACK, ACK, and resource exhaustion.", keywords: ["syn", "ack", "handshake", "exhaustion", "resource", "half-open"] },
  { id: "net_o2", type: "open", category: "network", prompt: "What is ARP Spoofing and how can an attacker use it to perform a Man-in-the-Middle attack?", rubric: "Mention MAC address mapping, broadcasting false ARP replies, and intercepting traffic.", keywords: ["mac", "address", "broadcast", "intercept", "mitm", "table", "poison"] },
  { id: "net_o3", type: "open", category: "network", prompt: "Describe the differences between an IDS and an IPS.", rubric: "Mention detection vs prevention, inline vs out-of-band deployment, and active blocking.", keywords: ["detect", "prevent", "inline", "block", "alert", "active", "passive"] },
  { id: "net_m1", type: "mcq", category: "network", prompt: "Which layer of the OSI model does a standard network router operate on?", options: ["A. Layer 2 (Data Link)", "B. Layer 3 (Network)", "C. Layer 4 (Transport)", "D. Layer 7 (Application)"], correctOption: 1 },
  { id: "net_m2", type: "mcq", category: "network", prompt: "Which protocol is used to securely manage network devices over an encrypted channel?", options: ["A. Telnet", "B. SSH", "C. SNMPv1", "D. FTP"], correctOption: 1 },
  { id: "net_m3", type: "mcq", category: "network", prompt: "What is the default port for HTTPS?", options: ["A. 80", "B. 443", "C. 8443", "D. 22"], correctOption: 1 },
  { id: "net_m4", type: "mcq", category: "network", prompt: "Which type of firewall inspects the state and context of active connections?", options: ["A. Packet Filtering", "B. Stateful Inspection", "C. Proxy Firewall", "D. WAF"], correctOption: 1 },
  { id: "net_m5", type: "mcq", category: "network", prompt: "What port does DNS primarily operate on?", options: ["A. 53", "B. 21", "C. 25", "D. 110"], correctOption: 0 },

  // --- LINUX/SYSTEMS ---
  { id: "lin_o1", type: "open", category: "linux", prompt: "Explain the concept of SUID in Linux and how it can be exploited for privilege escalation.", rubric: "Mention execute permissions, running as owner, and exploiting vulnerable binaries.", keywords: ["execute", "owner", "root", "binary", "privilege", "escalation", "vulnerable", "suid"] },
  { id: "lin_o2", type: "open", category: "linux", prompt: "Describe the purpose of the /etc/shadow file and the risks if it is world-readable.", rubric: "Mention password hashes, salt, and offline cracking.", keywords: ["hash", "password", "crack", "salt", "offline", "shadow"] },
  { id: "lin_o3", type: "open", category: "linux", prompt: "How would you secure an SSH server exposed to the public internet?", rubric: "Mention key-based auth, disabling root login, changing ports, fail2ban.", keywords: ["key", "root", "disable", "fail2ban", "port", "passwordless"] },
  { id: "lin_m1", type: "mcq", category: "linux", prompt: "Which command is used to change file permissions in Linux?", options: ["A. chown", "B. chmod", "C. chgrp", "D. passwd"], correctOption: 1 },
  { id: "lin_m2", type: "mcq", category: "linux", prompt: "What does the 'grep' command do?", options: ["A. Searches for patterns in files", "B. Compresses files", "C. Manages network interfaces", "D. Lists directory contents"], correctOption: 0 },
  { id: "lin_m3", type: "mcq", category: "linux", prompt: "In Linux, which directory typically contains system configuration files?", options: ["A. /var", "B. /bin", "C. /etc", "D. /home"], correctOption: 2 },
  { id: "lin_m4", type: "mcq", category: "linux", prompt: "Which command shows the current running processes and their resource usage in real-time?", options: ["A. ps", "B. top", "C. netstat", "D. ls"], correctOption: 1 },
  { id: "lin_m5", type: "mcq", category: "linux", prompt: "Which of the following is the root user's UID in Linux?", options: ["A. -1", "B. 1", "C. 0", "D. 1000"], correctOption: 2 },

  // --- WINDOWS/AD ---
  { id: "win_o1", type: "open", category: "windows", prompt: "Explain how Pass-the-Hash works in an Active Directory environment.", rubric: "Mention NTLM hashes, bypassing plaintext passwords, and lateral movement.", keywords: ["ntlm", "hash", "plaintext", "lateral", "movement", "authenticate", "lsass"] },
  { id: "win_o2", type: "open", category: "windows", prompt: "What is Kerberoasting and how can a defender detect or prevent it?", rubric: "Mention requesting TGS tickets, SPNs, offline cracking, and strong service account passwords.", keywords: ["tgs", "spn", "ticket", "crack", "offline", "service", "account", "kerberos"] },
  { id: "win_o3", type: "open", category: "windows", prompt: "Describe the role of the LSASS process and why attackers target it.", rubric: "Mention credential storage, memory dumping, Mimikatz, and cleartext passwords.", keywords: ["credential", "memory", "dump", "mimikatz", "cleartext", "lsass", "hash"] },
  { id: "win_m1", type: "mcq", category: "windows", prompt: "Which protocol is primarily used by Active Directory for authentication?", options: ["A. NTLM", "B. Kerberos", "C. LDAP", "D. RADIUS"], correctOption: 1 },
  { id: "win_m2", type: "mcq", category: "windows", prompt: "What is the default port for RDP (Remote Desktop Protocol)?", options: ["A. 3389", "B. 22", "C. 445", "D. 139"], correctOption: 0 },
  { id: "win_m3", type: "mcq", category: "windows", prompt: "Which Windows tool is often abused to execute scripts and commands remotely in a stealthy manner?", options: ["A. Command Prompt", "B. PowerShell", "C. Task Manager", "D. Event Viewer"], correctOption: 1 },
  { id: "win_m4", type: "mcq", category: "windows", prompt: "What is BloodHound used for in Active Directory pentesting?", options: ["A. Cracking passwords", "B. Mapping domain trust relationships and attack paths", "C. Sniffing network traffic", "D. Exploiting SMB vulnerabilities"], correctOption: 1 },

  // --- CLOUD SECURITY ---
  { id: "cld_o1", type: "open", category: "cloud", prompt: "What is an overly permissive IAM role, and how can it lead to a cloud compromise?", rubric: "Mention least privilege, wildcard permissions, and privilege escalation.", keywords: ["privilege", "wildcard", "escalation", "least", "access", "policy", "iam"] },
  { id: "cld_o2", type: "open", category: "cloud", prompt: "How would you secure an AWS S3 bucket containing sensitive company data?", rubric: "Mention private ACLs, bucket policies, encryption at rest, logging, and block public access.", keywords: ["private", "policy", "encrypt", "public", "block", "log"] },
  { id: "cld_m1", type: "mcq", category: "cloud", prompt: "Which AWS service is commonly misconfigured, leading to public data leaks?", options: ["A. EC2", "B. S3", "C. RDS", "D. Lambda"], correctOption: 1 },
  { id: "cld_m2", type: "mcq", category: "cloud", prompt: "What is the primary principle of Cloud Security Posture Management (CSPM)?", options: ["A. Encrypting all data", "B. Monitoring and correcting misconfigurations", "C. Writing secure code", "D. Managing physical data center access"], correctOption: 1 },
  { id: "cld_m3", type: "mcq", category: "cloud", prompt: "Which of the following describes the Shared Responsibility Model in cloud computing?", options: ["A. The cloud provider handles all security.", "B. The customer handles all security.", "C. Security obligations are divided between the provider and the customer.", "D. Third-party auditors are responsible for security."], correctOption: 2 },

  // --- CRYPTOGRAPHY ---
  { id: "cry_o1", type: "open", category: "crypto", prompt: "Explain the difference between symmetric and asymmetric encryption.", rubric: "Mention shared keys vs public/private key pairs and performance differences.", keywords: ["shared", "public", "private", "pair", "key", "performance", "speed", "symmetric"] },
  { id: "cry_o2", type: "open", category: "crypto", prompt: "Why is MD5 considered insecure for storing passwords today?", rubric: "Mention collisions, fast calculation speed allowing brute force/rainbow tables.", keywords: ["collision", "fast", "brute", "rainbow", "table", "weak"] },
  { id: "cry_m1", type: "mcq", category: "crypto", prompt: "Which of the following is a hashing algorithm, not an encryption algorithm?", options: ["A. AES", "B. RSA", "C. SHA-256", "D. DES"], correctOption: 2 },
  { id: "cry_m2", type: "mcq", category: "crypto", prompt: "What is the purpose of adding a 'salt' to a password hash?", options: ["A. To make the hash shorter", "B. To prevent rainbow table attacks", "C. To encrypt the password", "D. To make the password easier to remember"], correctOption: 1 },
  { id: "cry_m3", type: "mcq", category: "crypto", prompt: "Which asymmetric algorithm is widely used for secure data transmission on the web?", options: ["A. AES", "B. Blowfish", "C. RSA", "D. SHA-1"], correctOption: 2 },

  // --- SOC / INCIDENT RESPONSE ---
  { id: "soc_o1", type: "open", category: "soc_ir", prompt: "Describe the phases of the Incident Response lifecycle.", rubric: "Preparation, Detection/Analysis, Containment/Eradication, Recovery, Post-Incident.", keywords: ["prepare", "detect", "contain", "eradicate", "recover", "post", "lesson"] },
  { id: "soc_o2", type: "open", category: "soc_ir", prompt: "What is the purpose of a SIEM, and what makes a good correlation rule?", rubric: "Centralized logging, alerting, reducing false positives, combining events.", keywords: ["log", "central", "alert", "false positive", "correlate", "event"] },
  { id: "soc_m1", type: "mcq", category: "soc_ir", prompt: "What does SIEM stand for?", options: ["A. Security Incident and Event Management", "B. System Information and Event Monitor", "C. Security Information and Event Management", "D. Secure Infrastructure and Endpoint Manager"], correctOption: 2 },
  { id: "soc_m2", type: "mcq", category: "soc_ir", prompt: "Which of the following is a key metric in Incident Response?", options: ["A. MTTD (Mean Time to Detect)", "B. ROI (Return on Investment)", "C. SLA (Service Level Agreement)", "D. CTR (Click-Through Rate)"], correctOption: 0 },
  { id: "soc_m3", type: "mcq", category: "soc_ir", prompt: "In the context of SOC, what is 'hunting'?", options: ["A. Firing underperforming analysts", "B. Proactively searching for undetected threats in the network", "C. Applying vendor patches", "D. Scanning for known CVEs"], correctOption: 1 },

  // --- MALWARE / REVERSE ENGINEERING ---
  { id: "mal_o1", type: "open", category: "malware", prompt: "What is the difference between static and dynamic malware analysis?", rubric: "Mention examining code without executing vs running in a sandbox.", keywords: ["execute", "run", "sandbox", "code", "examine", "disassemble"] },
  { id: "mal_o2", type: "open", category: "malware", prompt: "Explain what ransomware is and the typical mechanisms it uses to spread and encrypt.", rubric: "Mention lateral movement, asymmetric/symmetric encryption, and extortion.", keywords: ["encrypt", "extort", "ransom", "lateral", "spread", "key"] },
  { id: "mal_m1", type: "mcq", category: "malware", prompt: "Which tool is commonly used to reverse engineer Windows binaries (disassembler/decompiler)?", options: ["A. Nmap", "B. Wireshark", "C. Ghidra", "D. Metasploit"], correctOption: 2 },
  { id: "mal_m2", type: "mcq", category: "malware", prompt: "What is an 'Indicator of Compromise' (IoC)?", options: ["A. A patched vulnerability", "B. Artifacts that indicate an intrusion has occurred", "C. A firewall rule", "D. A type of malware"], correctOption: 1 },
  { id: "mal_m3", type: "mcq", category: "malware", prompt: "What does malware packing refer to?", options: ["A. Compressing and obfuscating the executable to evade signatures", "B. Bundling multiple malware together", "C. Sending malware via zip files", "D. Embedding malware in hardware"], correctOption: 0 },

  // --- GENERAL / FOUNDATIONAL ---
  { id: "gen_o1", type: "open", category: "general", prompt: "Describe your methodology when approaching a new target for a penetration test.", rubric: "Mention recon/OSINT, scanning, enumeration, exploitation, and reporting.", keywords: ["recon", "osint", "scan", "enumerate", "exploit", "report", "methodology"] },
  { id: "gen_o2", type: "open", category: "general", prompt: "What is the principle of 'Least Privilege'?", rubric: "Mention giving users only the access they strictly need to perform their jobs.", keywords: ["access", "need", "job", "minimum", "restrict", "permission"] },
  { id: "gen_o3", type: "open", category: "general", prompt: "Explain the importance of Threat Modeling in the software development lifecycle.", rubric: "Identify risks early, design mitigations, save cost later.", keywords: ["risk", "early", "design", "mitigate", "cost", "lifecycle", "identify"] },
  { id: "gen_m1", type: "mcq", category: "general", prompt: "What does the 'C' in the CIA triad stand for?", options: ["A. Control", "B. Confidentiality", "C. Compliance", "D. Connectivity"], correctOption: 1 },
  { id: "gen_m2", type: "mcq", category: "general", prompt: "Which of these is an example of Social Engineering?", options: ["A. SQL Injection", "B. Buffer Overflow", "C. Phishing", "D. Port Scanning"], correctOption: 2 },
  { id: "gen_m3", type: "mcq", category: "general", prompt: "What is a 'Zero-Day' vulnerability?", options: ["A. A vulnerability that takes zero days to fix", "B. An unknown vulnerability with no patch available", "C. A vulnerability found on the first day of testing", "D. A feature that acts like a vulnerability"], correctOption: 1 },
  { id: "gen_m4", type: "mcq", category: "general", prompt: "Which document defines the rules of engagement and scope for a penetration test?", options: ["A. Non-Disclosure Agreement (NDA)", "B. Statement of Work (SOW) / Rules of Engagement (RoE)", "C. Penetration Test Report", "D. Service Level Agreement (SLA)"], correctOption: 1 },
  { id: "gen_m5", type: "mcq", category: "general", prompt: "What is the main goal of a Red Team engagement compared to a standard Penetration Test?", options: ["A. Find as many vulnerabilities as possible", "B. Test the organization's detection and response capabilities", "C. Verify compliance with PCI-DSS", "D. Scan external IP addresses"], correctOption: 1 }
];
