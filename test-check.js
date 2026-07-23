fetch('https://cyberlabsec.tech/api/applications/status-check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ referenceId: 'APP-CF941373' })
}).then(res => res.json()).then(console.log).catch(console.error);
