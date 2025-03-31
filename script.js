document
  .getElementById("paymentForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const phoneNumber = document.getElementById("phoneNumber").value;
    const statusDiv = document.getElementById("status");

    // Basic validation
    if (!validatePhoneNumber(phoneNumber)) {
      showStatus(
        "Please enter a valid phone number in the format: 254712345678",
        "error"
      );
      return;
    }

    try {
      showStatus("Sending payment request...", "success");

      // Make API call to our backend
      const response = await fetch(
        "http://localhost:3000/api/initiate-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showStatus(
          "Payment request sent! The recipient will receive an M-Pesa prompt on their phone to pay 1000 KES.",
          "success"
        );
        document.getElementById("paymentForm").reset();
      } else {
        showStatus(
          `Failed to send payment request: ${
            data.error || "Unknown error occurred"
          }`,
          "error"
        );
      }
    } catch (error) {
      showStatus(
        "Failed to send payment request. Please try again later.",
        "error"
      );
      console.error("Payment error:", error);
    }
  });

function validatePhoneNumber(phone) {
  // Basic Kenyan phone number validation
  const phoneRegex = /^254\d{9}$/;
  return phoneRegex.test(phone);
}

function showStatus(message, type) {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${type}`;

  // Clear status after 5 seconds
  setTimeout(() => {
    statusDiv.className = "status-message";
  }, 5000);
}

// Format phone number as user types
document.getElementById("phoneNumber").addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.startsWith("0")) {
    value = "254" + value.substring(1);
  }
  if (value.length > 12) {
    value = value.substring(0, 12);
  }
  e.target.value = value;
});
