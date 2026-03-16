const resend = require('resend');
const path = require('path');
const fs = require('fs').promises;
const { compile } = require('handlebars');
const Logger = require('../utils/logger');

const logger = new Logger();

// Initialize Resend with your API key
const resendClient = new resend.Resend(process.env.RESEND_API_KEY);

// Point to the base directory (your-project-root)
const BASE_DIR = path.resolve(__dirname, '..'); // Adjust if needed
logger.info(`Base directory for templates: ${BASE_DIR}`);
const TEMPLATE_DIR = path.join(BASE_DIR, 'templates');

const sendHtmlEmail = async (email, subject, htmlContent, templatePath, templateContext = {}) => {
  let finalHtmlContent = htmlContent;

  // Render template if template path is provided
  if (templatePath && !htmlContent) {
    try {
      const templateFullPath = path.join(TEMPLATE_DIR, templatePath);
      const templateSource = await fs.readFile(templateFullPath, 'utf-8');

      // Compile and render template with Handlebars
      const template = compile(templateSource);
      finalHtmlContent = template(templateContext);
    } catch (error) {
      logger.error(`Error rendering email template: ${error}`);
      return {
        status: 'error',
        message: `Template error: ${error.message}`,
      };
    }
  }

  // Prepare the TO list (Resend uses array of emails)
  const toEmails = [email];

  // Get sender information from environment variables
  const fromName = process.env.RESEND_FROM_NAME;
  const fromAddress = process.env.RESEND_FROM_ADDRESS;

  const params = {
    from: fromName ? `${fromName} <${fromAddress}>` : fromAddress,
    to: toEmails,
    subject: subject,
    html: finalHtmlContent,
  };

  try {
    const response = await resendClient.emails.send(params);
    logger.info(`Email sent successfully, response: ${JSON.stringify(response)}`);
    return {
      status: 'success',
      response: response,
    };
  } catch (error) {
    logger.error(`Error sending email with Resend: ${error}`);
    return {
      status: 'error',
      message: error.message,
    };
  }
};

module.exports = { sendHtmlEmail };
