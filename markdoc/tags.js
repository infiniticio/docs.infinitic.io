import { Callout } from '@/components/Callout'
import { QuickLink, QuickLinks } from '@/components/QuickLinks'
import { Codes } from '@/components/Codes'
import { CodeJava } from '@/components/CodeJava'
import { CodeKotlin } from '@/components/CodeKotlin'
import { CodeIcon } from '@/components/CodeIcon'

const tags = {
  callout: {
    attributes: {
      title: { type: String },
      type: {
        type: String,
        default: 'note',
        matches: ['note', 'warning'],
        errorLevel: 'critical',
      },
    },
    render: Callout,
  },
  figure: {
    selfClosing: true,
    attributes: {
      src: { type: String },
      alt: { type: String },
      caption: { type: String },
    },
    render: ({ src, alt = '', caption }) => (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
        <figcaption>{caption}</figcaption>
      </figure>
    ),
  },
  'quick-links': {
    render: QuickLinks,
  },
  'quick-link': {
    selfClosing: true,
    render: QuickLink,
    attributes: {
      title: { type: String },
      description: { type: String },
      icon: { type: String },
      href: { type: String },
    },
  },
  'codes': {
    render: Codes
  },
  'code-java': {
    render: CodeJava
  },
  'code-kotlin': {
    render: CodeKotlin
  },
  'code-icon': {
    selfClosing: true,
    render: CodeIcon,
    attributes: {
      type: {
        type: String,
        default: 'java',
        matches: ['java', 'kotlin']
      }
    },
  },
}

export default tags
