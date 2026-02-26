import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export const clsxm = (...args: any[]) => {
  return twMerge(clsx(args))
}

export const escapeHTMLTag = (html: string) => {
  const lt = /</g,
    gt = />/g,
    ap = /'/g,
    ic = /"/g
  return html
    .toString()
    .replaceAll(lt, '&lt;')
    .replaceAll(gt, '&gt;')
    .replaceAll(ap, '&#39;')
    .replaceAll(ic, '&#34;')
}
