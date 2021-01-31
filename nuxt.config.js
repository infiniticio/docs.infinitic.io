import theme from '@nuxt/content-theme-docs'

export default theme({
  target: 'static',
  docs: {
    primaryColor: '#2C88D9'
  },
  content: {
    markdown: {
      prism: {
        theme: 'prism-themes/themes/prism-darcula.css'
      }
    }
  },
  head: {
    link: [
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicons/favicon-16x16.png',
        sizes: '16x16'
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicons/favicon-32x32.png',
        sizes: '32x32'
      },
      {
        rel: 'apple-touch-icon',
        type: 'image/png',
        href: '/favicons/apple-touch-icon.png',
        sizes: '180x180'
      },
      {
        rel: 'manifest',
        href: '/favicons/site.webmanifest'
      }
    ],
    title: "Infinitic Documentation",
    meta: [
      {
        hid: "description",
        name: "description",
        content:
          "Infinitic is a framework based on Apache Pulsar that considerably eases building distributed apps. In particular, Infinitic is very good at orchestrating workflows.",
      }
    ]
  }
})
