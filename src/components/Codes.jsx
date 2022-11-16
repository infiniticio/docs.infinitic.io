import { useEffect } from 'react'

export function Codes({ children }) {

  useEffect(() => {
    const code = document.documentElement.getAttribute('data-code')
     // display this language
     document.querySelectorAll('[data-language-code='+code+']').forEach((el) => { el.removeAttribute('hidden') })
     // hide all others
     document.querySelectorAll('[data-language-code]:not([data-language-code='+code+'])').forEach((el) => { el.setAttribute('hidden', true) })
  })

  return children.map((child, idx) => 
    <div data-language-code={child.props.language} key={idx} hidden>
      { child }
    </div>
  )
}
