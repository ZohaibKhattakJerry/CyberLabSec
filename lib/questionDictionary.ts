export const QUESTION_BANK = {
  security: [
    { type: "mcq", prompt: "What does XSS stand for?", options: ["Cross-Site Scripting", "XML Site Security", "Cross-Server Scripting", "X-Site System"], correctOption: 0 },
    { type: "mcq", prompt: "Which of the following is a common defense against SQL Injection?", options: ["Prepared Statements", "Base64 Encoding", "MD5 Hashing", "CORS"], correctOption: 0 },
    { type: "mcq", prompt: "What is the primary purpose of a WAF?", options: ["To speed up web traffic", "To filter and monitor HTTP traffic", "To manage databases", "To host DNS records"], correctOption: 1 },
    { type: "mcq", prompt: "What does CSRF stand for?", options: ["Cross-Site Request Forgery", "Centralized Security Rules Framework", "Cross-Server Routing Function", "Client-Side Request Formatting"], correctOption: 0 },
    { type: "mcq", prompt: "In cryptography, what is salt used for?", options: ["To encrypt the data faster", "To defend against dictionary attacks and rainbow tables", "To make the data readable", "To compress the password"], correctOption: 1 }
  ],
  pentest: [
    { type: "mcq", prompt: "Which tool is commonly used for network discovery and security auditing?", options: ["Nmap", "Postman", "Docker", "Jenkins"], correctOption: 0 },
    { type: "mcq", prompt: "What is the default port for SSH?", options: ["21", "22", "80", "443"], correctOption: 1 },
    { type: "mcq", prompt: "What phase of a penetration test involves gathering information without directly interacting with the target?", options: ["Active Reconnaissance", "Passive Reconnaissance", "Exploitation", "Reporting"], correctOption: 1 },
    { type: "mcq", prompt: "Which tool is known as an interception proxy often used for web app pentesting?", options: ["Burp Suite", "Wireshark", "Metasploit", "John the Ripper"], correctOption: 0 },
    { type: "mcq", prompt: "What is privilege escalation?", options: ["Gaining unauthorized access to a system", "Exploiting a bug to gain elevated access to resources", "Creating a new admin account", "Encrypting files on a server"], correctOption: 1 }
  ],
  frontend: [
    { type: "mcq", prompt: "What does the 'useState' hook do in React?", options: ["Fetches data", "Manages state in a functional component", "Updates the DOM directly", "Creates a new context"], correctOption: 1 },
    { type: "mcq", prompt: "Which CSS property is used to change the text color of an element?", options: ["text-color", "color", "font-color", "bg-color"], correctOption: 1 },
    { type: "mcq", prompt: "What is the Virtual DOM?", options: ["A direct copy of the real DOM", "A lightweight JavaScript representation of the DOM", "A browser extension", "A 3D rendering engine"], correctOption: 1 },
    { type: "mcq", prompt: "In CSS Flexbox, which property aligns items vertically in a row layout?", options: ["justify-content", "align-items", "flex-direction", "align-content"], correctOption: 1 },
    { type: "mcq", prompt: "What is the purpose of 'useEffect' in React?", options: ["To style components", "To perform side effects in function components", "To route pages", "To validate props"], correctOption: 1 }
  ],
  backend: [
    { type: "mcq", prompt: "What is the primary function of Node.js?", options: ["Frontend styling", "Running JavaScript on the server", "Database management", "Machine Learning"], correctOption: 1 },
    { type: "mcq", prompt: "Which HTTP status code indicates that a resource was not found?", options: ["200", "401", "404", "500"], correctOption: 2 },
    { type: "mcq", prompt: "What is an ORM?", options: ["Object-Relational Mapping", "Online Resource Management", "Operational Routing Model", "Open REST Middleware"], correctOption: 0 },
    { type: "mcq", prompt: "Which HTTP method is typically used to update an existing resource completely?", options: ["POST", "PUT", "PATCH", "DELETE"], correctOption: 1 },
    { type: "mcq", prompt: "What is the purpose of a JWT?", options: ["Database indexing", "Stateless authentication", "File compression", "Load balancing"], correctOption: 1 }
  ],
  general: [
    { type: "mcq", prompt: "What does API stand for?", options: ["Application Programming Interface", "Advanced Programming Integration", "Automated Process Interface", "Application Process Integration"], correctOption: 0 },
    { type: "mcq", prompt: "What is Git used for?", options: ["Database hosting", "Version control", "Writing HTML", "Image editing"], correctOption: 1 },
    { type: "mcq", prompt: "What is the purpose of Docker?", options: ["To write code faster", "To package applications into containers", "To secure networks", "To manage databases"], correctOption: 1 },
    { type: "mcq", prompt: "Which of the following is a NoSQL database?", options: ["PostgreSQL", "MySQL", "MongoDB", "Oracle"], correctOption: 2 },
    { type: "mcq", prompt: "What does CI/CD stand for?", options: ["Continuous Integration / Continuous Deployment", "Code Integration / Code Delivery", "Centralized Information / Central Data", "Command Interface / Command Directory"], correctOption: 0 }
  ]
};

export function generateQuestionsForJob(title: string, description: string, requirements: string) {
  const combinedText = `${title} ${description} ${requirements}`.toLowerCase();
  
  let selectedCategories = ["general"];
  
  if (combinedText.includes("secur") || combinedText.includes("cyber") || combinedText.includes("vulnerab") || combinedText.includes("soc")) {
    selectedCategories.push("security");
  }
  if (combinedText.includes("pentest") || combinedText.includes("hacker") || combinedText.includes("offensive") || combinedText.includes("red team")) {
    selectedCategories.push("pentest");
  }
  if (combinedText.includes("react") || combinedText.includes("frontend") || combinedText.includes("ui") || combinedText.includes("next")) {
    selectedCategories.push("frontend");
  }
  if (combinedText.includes("node") || combinedText.includes("backend") || combinedText.includes("api") || combinedText.includes("database")) {
    selectedCategories.push("backend");
  }

  // If we only have general, add a bit of security as default for a cybersec company
  if (selectedCategories.length === 1) {
    selectedCategories.push("security");
  }

  let pool: any[] = [];
  selectedCategories.forEach(cat => {
    if (QUESTION_BANK[cat as keyof typeof QUESTION_BANK]) {
      pool = pool.concat(QUESTION_BANK[cat as keyof typeof QUESTION_BANK]);
    }
  });

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Select up to 10 questions
  const selected = pool.slice(0, 10).map(q => ({
    ...q,
    id: Math.random().toString(36).substring(2, 9),
    points: 10
  }));

  return selected;
}
