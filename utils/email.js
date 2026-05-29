const nodemailer = require("nodemailer");
const dns = require("dns");
require("dotenv").config();

// Force IPv4 (important for your ENETUNREACH issue)
dns.setDefaultResultOrder("ipv4first");

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,              // IMPORTANT: switch from 587 → 465
    secure: true,           // true for 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.log("SMTP connection error:", error);
    } else {
        console.log("SMTP is ready to send emails");
    }
});

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: `"Auth System" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };