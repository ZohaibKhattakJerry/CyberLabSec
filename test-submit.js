const formData = new FormData();
formData.append("postingId", "123");
formData.append("fullName", "John Doe");
formData.append("email", "john@example.com");
formData.append("phone", "03001234567");
formData.append("city", "Lahore");
formData.append("motivation", "I want to work here because it is awesome.");
formData.append("consentData", "true");
formData.append("consentInterview", "true");
formData.append("cv", new Blob(["dummy cv content"], { type: "application/pdf" }), "cv.pdf");

fetch("http://localhost:3000/api/applications/submit", {
  method: "POST",
  body: formData
}).then(r => r.json()).then(console.log).catch(console.error);
