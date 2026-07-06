export interface VerificationEmailData {
  verificationUrl: string;
  greeting: string;
  body: string;
  cta: string;
  expiry: string;
  ignore: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

export function verificationEmailTemplate({
  verificationUrl,
  greeting,
  body,
  cta,
  expiry,
  ignore,
}: VerificationEmailData): RenderedEmail {
  const text = `${greeting}

${body}
${verificationUrl}

${expiry}

${ignore}`;

  const html = `
    <p>${greeting}</p>
    <p>${body}</p>
    <p><a href="${verificationUrl}">${cta}</a></p>
    <p>${expiry}</p>
    <p style="color:#888">${ignore}</p>
  `;

  return { html, text };
}
