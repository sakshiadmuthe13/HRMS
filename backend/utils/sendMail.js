import { getTransporter } from "../config/nodemailer.js";

export const sendMail = async (to, subject, text, html) => {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"DW Innovations Pvt. Ltd." <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
};
