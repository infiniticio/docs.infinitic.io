import Image from 'next/image'
import JavaColor from '@/images/java-color.svg'
import KotlinColor from '@/images/kotlin-color.svg'


const codes = [
  { type: 'java', icon: JavaColor },
  { type: 'kotlin', icon: KotlinColor }
]

export function CodeIcon({ type }) {

  const code = codes.find( (code) => code.type === type )

  return <span 
  className="h-6 w-6 items-center justify-center rounded-lg shadow-md shadow-black/5 ring-1 ring-black/5 dark:bg-slate-700 dark:ring-inset dark:ring-white/5"
  style={{display: "inline-flex"}}>
    <Image 
    src={code.icon.src}
    alt="Java"
    height={30}
    width={30} 
    className="h-4 w-4 inline not-prose" />
    </span>
}
