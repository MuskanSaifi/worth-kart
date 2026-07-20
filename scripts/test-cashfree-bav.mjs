import "dotenv/config";

const clientId = process.env.CASHFREE_SECURE_ID_CLIENT_ID;
const clientSecret = process.env.CASHFREE_SECURE_ID_CLIENT_SECRET;

const bases = [
  "https://api.cashfree.com/verification",
  "https://sandbox.cashfree.com/verification",
  "https://payout-api.cashfree.com",
  "https://api.cashfree.com/pg",
];

for (const base of bases) {
  const paths = ["/api/v1/credentials/verify", "/bank-account/sync"];
  for (const p of paths) {
    try {
      const res = await fetch(`${base}${p}`, {
        method: p.includes("sync") ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-api-version": "2023-12-18",
        },
        body: p.includes("sync")
          ? JSON.stringify({ bank_account: "10217991795", ifsc: "IDFB0020158" })
          : undefined,
      });
      const t = await res.text();
      if (res.status !== 404 || !t.includes("Route Not Found")) {
        console.log(base + p, res.status, t.slice(0, 150));
      }
    } catch (e) {
      console.log(base + p, "ERR", e.message);
    }
  }
}

// Payout authorize
const auth = await fetch("https://payout-api.cashfree.com/payout/v1/authorize", {
  method: "POST",
  headers: {
    "X-Client-Id": clientId,
    "X-Client-Secret": clientSecret,
  },
});
console.log("\npayout authorize:", auth.status, (await auth.text()).slice(0, 200));
