import { sendInterviewInvite } from "./lib/email";
async function test() {
  try {
    await sendInterviewInvite("mrzohaibkhattak@gmail.com", "Test User", "Security Analyst", "https://cyberlabsec.tech", 168);
    console.log("SUCCESS");
  } catch(e) {
    console.error("FAILED:", e);
  }
}
test();
