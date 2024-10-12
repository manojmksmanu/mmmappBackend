const nodemailer = require("nodemailer");

exports.sendVerificationEmail = async ({ email, verificationLink }) => {
  console.log(email, "email");
  try {
    console.log("verificationemail generator");

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "manojforwork2022@gmail.com",
        pass: "kxvx tnam hiii ptms", // Ideally, use environment variables for security
      },
    });

    console.log("1");

    const mailOptions = {
      from: "manojforwork2022@gmail.com",
      to: email,
      subject: "Verify your email (MyMegaminds)",
      html: `<p>Click the following link to verify your account:</p>
             <a href="${verificationLink}">Verify Email</a>`,
    };

    console.log("2");
    // Await the result of sendMail
    await transporter.sendMail(mailOptions, (error, emailResponse) => {
      if (error) {
        console.log(error, "inside error");
        throw error;
      }
      console.log("success");
      response.end();
    });
    console.log("final");
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};

exports.sendEmail = async ({ to, message, text }) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or any other email service
    auth: {
      user: "manojforwork2022@gmail.com",
      pass: "kxvx tnam hiii ptms", // Your email password
    },
  });

  const mailOptions = {
    from: "manojforwork2022@gmail.com",
    to,
    message,
    text,
  };

  await transporter.sendMail(mailOptions);
};
