document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;

      try {
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
          alert("Registration successful! Proceed to login.");
          window.location.href = "login.html";
        } else {
          // Optional: show errors on page instead of alert
          // document.getElementById('registerMessage').textContent = data.message;
        }
      } catch (err) {
        console.error("Register Error:", err);
        alert("Something went wrong with registration.");
      }
    });
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      const message = document.getElementById("loginMessage");

      if (!email.endsWith("@cmrcet.ac.in")) {
        alert("Please use your college email (@cmrcet.ac.in)");
        return;
      }

      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("userEmail", email);
          alert("Login successful! Redirecting...");

          if (data.role === "student") {
            window.location.href = "student_dashboard.html";
          } else if (data.role === "technician") {
            window.location.href = "technician_dashboard.html";
          } else {
            window.location.href = "main.html";
          }
        } else {
          message.textContent = data.message || "Login failed";
        }
      } catch (err) {
        console.error("Login error:", err);
        message.textContent = "Server error. Please try again.";
      }
    });
  }
});
