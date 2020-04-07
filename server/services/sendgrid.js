const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setSubstitutionWrappers('{{', '}}');
module.exports = class SendGrid {
  constructor () { }

  async sendEmail (to, subject, templateId, substitutions) {
    const msg = {
      to: to,
      from: 'notreply@arvischain.com.br',
      subject: subject,
      templateId: templateId,
      substitutions: substitutions
    };
    return sgMail.send(msg);
  }
};
