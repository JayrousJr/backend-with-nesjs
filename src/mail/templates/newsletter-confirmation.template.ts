export interface NewsletterConfirmationData {
  greeting: string;
  body: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

export function newsletterConfirmationTemplate({
  greeting,
  body,
}: NewsletterConfirmationData): RenderedEmail {
  const text = `${greeting}\n\n${body}`;

  const html = `
    <p>${greeting}</p>
    <p>${body}</p>
  `;

  return { html, text };
}
