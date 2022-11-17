import { Callout } from '@/components/Callout'
import { QuickLink, QuickLinks } from '@/components/QuickLinks'
import { Codes } from '@/components/Codes'
import { CodeJava } from '@/components/CodeJava'
import { CodeKotlin } from '@/components/CodeKotlin'
import { CodeIcon } from '@/components/CodeIcon'
import { VersionDate } from '@/components/VersionDate'
import { VersionNewFeatures } from '@/components/VersionNewFeatures'
import { VersionBreakingChanges } from '@/components/VersionBreakingChanges'
import { VersionBugFixes } from '@/components/VersionBugFixes'
import { VersionImprovements } from '@/components/VersionImprovements'



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
  'version-date': {
    selfClosing: true,
    render: VersionDate,
    attributes: {
      date: String
    },
  },
  'version-new-features': {
    selfClosing: true,
    render: VersionNewFeatures
  },
  'version-breaking-changes': {
    selfClosing: true,
    render: VersionBreakingChanges
  },
  'version-bug-fixes': {
    selfClosing: true,
    render: VersionBugFixes
  },
  'version-improvements': {
    selfClosing: true,
    render: VersionImprovements
  },
}

export default tags
