// Send transactional email through Resend's HTTPS API.
// Render Free blocks outbound SMTP, while HTTPS requests are supported.
const mailSender = async (email, title, body) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and MAIL_FROM must be configured");
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: title,
        html: body,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Resend rejected the email request");
    }

    return result;
  } catch (error) {
    console.error("Error while sending mail:", error.message);
    throw error;
  }
};

module.exports = mailSender;
