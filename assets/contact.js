const form = document.querySelector('#contact-form');

form?.addEventListener('submit', event => {
  if (!form.reportValidity()) return;
  event.preventDefault();
  const fields = new FormData(form);
  const name = String(fields.get('name') || '').trim();
  const email = String(fields.get('email') || '').trim();
  const phone = String(fields.get('phone') || '').trim();
  const message = String(fields.get('message') || '').trim();
  const subject = `Website enquiry from ${name}`;
  const body = [`Name: ${name}`, `Email: ${email}`, `Phone: ${phone || 'Not provided'}`, '', 'Message:', message].join('\n');
  window.location.href = `mailto:wrapnrollns@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
