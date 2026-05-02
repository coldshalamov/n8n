export type EmailType =
  | 'bid'
  | 'invoice'
  | 'lien_waiver'
  | 'permit'
  | 'contract'
  | 'photos'
  | 'update'
  | 'general';

const IMAGE_MIME = /^image\//;

export function classifyEmail(args: {
  subject: string;
  body: string;
  attachmentTypes: string[];
}): EmailType {
  const text = `${args.subject} ${args.body}`.toLowerCase();
  const hasImages = args.attachmentTypes.some((t) => IMAGE_MIME.test(t));

  if (/\bbid\b|\bestimate\b|\bquote\b|\bproposal\b/.test(text)) return 'bid';
  if (/\binvoice\b|\bpayment\s+due\b|\bbill\b|\binv #?\d/.test(text)) return 'invoice';
  if (/\blien\b|\bwaiver\b/.test(text)) return 'lien_waiver';
  if (/\bpermit\b/.test(text)) return 'permit';
  if (/\bcontract\b|\bagreement\b/.test(text)) return 'contract';
  if (/\bupdate\b|\bprogress\b|\bstatus\b/.test(text)) return 'update';
  if (hasImages) return 'photos';
  return 'general';
}

export function attachmentTypeFor(emailType: EmailType, mimeType: string): string {
  if (IMAGE_MIME.test(mimeType)) return 'photo';
  switch (emailType) {
    case 'bid':
      return 'bid';
    case 'invoice':
      return 'invoice';
    case 'lien_waiver':
      return 'lien_waiver';
    case 'permit':
      return 'permit';
    case 'contract':
      return 'contract';
    default:
      return 'other';
  }
}
