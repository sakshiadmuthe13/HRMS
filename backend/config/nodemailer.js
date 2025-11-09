import nodemailer from "nodemailer";

let transporter;

// ✅ Step 1: Define and export getTransporter
export const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  return transporter;
};

// ✅ Step 2: Define and export sendMail
export const sendMail = async (to, subject, text, html, attachments = []) => {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"DW Innovations Pvt. Ltd." <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error; // optional but helps controllers detect failure
  }
};
