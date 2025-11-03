// TODO: Make sure to switch to a real email account so that emails are actually sent.

import nodemailer, {createTestAccount, createTransport} from "nodemailer";

let testAccount: any;
let transporter: any;

/**
 * Sets up Ethereal email for sending test emails.
 */
async function setupEtherealEmail(): Promise<void> {
    testAccount = await createTestAccount();

    transporter = createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
}

setupEtherealEmail().catch(console.error);

/**
 * Sends an email using the Ethereal email service.
 * @param {string} to Recipient email address.
 * @param {string} subject Email subject.
 * @param {string} body Email body.
 */
export async function sendEmail(
    to: string, subject: string, body: string): Promise<void> {
    const mailOptions = {
        from: testAccount.user,
        to: to,
        subject: subject,
        text: body,
    };

    transporter.sendMail(mailOptions, (error: any, info: any): void => {
        if (error) console.error(`Error sending email: ${error}`);
        else {
            console.log(`Email sent: ${info.messageId}`);

            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) console.log(`Preview URL: ${previewUrl}`);
            else console.error("Failed to generate preview URL!");
        }
    });
}
