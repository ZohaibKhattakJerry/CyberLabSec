import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "mrzohaibkhattak@gmail.com",
    pass: "jccq fhij hxxb qlzj",
  },
});

async function main() {
  try {
    const info = await transporter.sendMail({
      from: 'CyberLabSec <contact@cyberlabsec.tech>',
      to: 'mrzohaibkhattak@gmail.com',
      subject: 'Test Email 2',
      text: 'This is a test email.',
    });
    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}
main();
