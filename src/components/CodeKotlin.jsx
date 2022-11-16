import { useEffect } from 'react'

export function CodeKotlin({ children }) {
  useEffect(() => {
    const code = document.documentElement.getAttribute('data-code')
     // display this language
     document.querySelectorAll('[data-language-code='+code+']').forEach((el) => { el.removeAttribute('hidden') })
     // hide all others
     document.querySelectorAll('[data-language-code]:not([data-language-code='+code+'])').forEach((el) => { el.setAttribute('hidden', true) })
  })

  return <span data-language-code='kotlin' hidden>
      { children }
    </span>
}
