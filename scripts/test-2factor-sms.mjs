import "dotenv/config";

const apiKey = process.env.TWO_FACTOR_API_KEY;
const phone = "9315604600";
const template = process.env.TWO_FACTOR_OTP_TEMPLATE || "OTPtemplate";

const res = await fetch(
  `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/AUTOGEN3/${template}`
);
console.log("SMS:", await res.text());
