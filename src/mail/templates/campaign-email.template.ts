export interface CampaignEmailData {
  bodyHtml: string;
  bodyText: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

export function campaignEmailTemplate({
  bodyHtml,
  bodyText,
}: CampaignEmailData): RenderedEmail {
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:sans-serif">
      ${bodyHtml}
    </div>
  `;

  return { html, text: bodyText };
}
