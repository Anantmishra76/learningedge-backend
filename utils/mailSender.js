const nodemailer = require("nodemailer");

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

const createTransporter = () => {
  const port = Number(process.env.MAIL_PORT || 587);
  const { MAIL_HOST: host, MAIL_USER: user, MAIL_PASS: pass } = process.env;

  if (!host || !user || !pass) {
    throw new Error("MAIL_HOST, MAIL_USER, and MAIL_PASS must be configured");
  }

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("MAIL_PORT must be a valid port number");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: parseBoolean(process.env.MAIL_SECURE, port === 465),
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
};

let transporter;

const getTransporter = () => {
  if (!transporter) transporter = createTransporter();
  return transporter;
};

const mailSender = async (email, title, body) => {
  const from = process.env.MAIL_FROM || process.env.MAIL_USER;

  try {
    return await getTransporter().sendMail({
      from,
      to: email,
      subject: title,
      html: body,
    });
  } catch (error) {
    console.error("Error while sending mail:", error.message);
    throw error;
  }
};

module.exports = mailSender;
