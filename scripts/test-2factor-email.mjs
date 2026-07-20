import "dotenv/config";

const apiKey = process.env.TWO_FACTOR_API_KEY;
const email = "nazim.saifi1908@gmail.com";
const sender = "kartworth@gmail.com";
const template = process.env.TWO_FACTOR_OTP_TEMPLATE || "OTPtemplate";

async function test(label, url, options) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    console.log(`\n${label}`);
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text.slice(0, 300)}`);
  } catch (error) {
    console.log(`\n${label}`);
    console.log(`FETCH ERROR: ${error.message}`);
  }
}

const encEmail = encodeURIComponent(email);
const encSender = encodeURIComponent(sender);

await test(
  "GET with sender in path",
  `https://2factor.in/API/V1/${apiKey}/EMAIL/${encEmail}/${encSender}/AUTOGEN3/${template}`
);

await test(
  "GET without sender",
  `https://2factor.in/API/V1/${apiKey}/EMAIL/${encEmail}/AUTOGEN3/${template}`
);

await test("POST unified OTP", "https://2factor.in/API/V1/OTP/SEND", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  },
  body: JSON.stringify({
    to: email,
    channel: "EMAIL",
    template,
    from: sender,
    otp_length: 4,
  }),
});
