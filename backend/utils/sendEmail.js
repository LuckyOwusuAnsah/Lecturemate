import nodemailer from  "nodemailer";

export const sendEmail = async ({ subject, message, send_to, sent_from }) => {
    

    // Create Email transporter 
    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    })

    const options = {
        from: `"LectureMate Support" <${sent_from}>`,
        to: send_to,
        subject,
        html: message

    }

    //Send Email
    const info = await transporter.sendMail(options);
    console.log("Email sent:", info.response);
}

