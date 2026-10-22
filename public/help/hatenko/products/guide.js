const dialog = document.getElementById('image-dialog');
const largeImage = document.getElementById('large-image');
const caption = document.getElementById('image-caption');
let imageTrigger = null;

document.querySelectorAll('[data-image]').forEach((button) => {
  button.addEventListener('click', () => {
    imageTrigger = button;
    largeImage.src = button.dataset.image;
    largeImage.alt = button.dataset.caption;
    caption.textContent = button.dataset.caption;
    dialog.showModal();
  });
});
document.getElementById('close-image').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => imageTrigger?.focus());
document.getElementById('print').addEventListener('click', () => window.print());

const links = [...document.querySelectorAll('nav a')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-12% 0px -62% 0px' },
  );
  document.querySelectorAll('main section').forEach((section) => observer.observe(section));
}
