const socket = io(); // Ensure Socket.IO client is connected
let errorSound = new Audio("/sounds/hands_on_steering_wheel.mp3")

socket.on("support", async (station) => {
  // If already exists, don't recreate
  if (document.getElementById("support-request-overlay")) return;
  if (window.sessionStorage.getItem("supportRequests") && window.sessionStorage.getItem("supportRequests") === "false") return;

  const overlay = document.createElement("div");
  overlay.id = "support-request-overlay";
  overlay.className =
    "fixed inset-0 bg-red-800 bg-opacity-75 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white";

  const text = document.createElement("div");
  text.className = "text-3xl font-bold mb-6 text-center px-4";
  text.innerText = `Segítség kérelmezve a(z) "${station}" állomáson!`;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = '<i class="ri-close-line text-3xl"></i>';
  closeBtn.className =
    "mt-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition";
  closeBtn.onclick = () => overlay.remove();

  overlay.appendChild(text);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);


    await errorSound.play()
    await errorSound.play()
});