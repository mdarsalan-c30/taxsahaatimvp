fetch("http://localhost:3000/api/auth/ca/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "partner@taxsaathi.com", password: "Partner2026" })
})
.then(res => res.json().then(data => ({status: res.status, data})))
.then(console.log)
.catch(console.error);
