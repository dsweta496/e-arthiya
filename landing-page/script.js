// Optional: quick link validation while developing.
document.querySelectorAll(".link-card").forEach((link) => {
  if (link.getAttribute("href") === "#") {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      alert("Add the final public URL to this link in index.html first.");
    });
  }
});
