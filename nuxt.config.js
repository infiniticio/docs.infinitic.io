import theme from '@nuxt/content-theme-docs'

export default theme({
  docs: {
    primaryColor: '#2C88D9'
  },
  content: {
    markdown: {
      prism: {
        theme: 'prism-themes/themes/prism-darcula.css'
      }
    }
  }
})
