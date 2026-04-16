export const normalizeArticleHtmlWhitespace = (html: string) =>
  html
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&#xA0;/gi, " ")
    .replace(/[\u00A0\u202F\u2007]/g, " ");
