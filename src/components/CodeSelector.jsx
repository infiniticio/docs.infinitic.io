import { useEffect, useState } from 'react'
import { Listbox } from '@headlessui/react'
import Image from 'next/image'
import clsx from 'clsx'

import JavaColor from '@/images/java-color.svg'
import KotlinColor from '@/images/kotlin-color.svg'


const codes = [
  { name: 'Java', value: 'java', icon: JavaColor },
  { name: 'Kotlin', value: 'kotlin', icon: KotlinColor }
]

export function CodeSelector(props) {
  let [selectedCode, setSelectedCode] = useState()

  useEffect(() => {
    if (selectedCode) {
      document.documentElement.setAttribute('data-code', selectedCode.value)
    } else {
      setSelectedCode(
        codes.find(
          (code) =>
            code.value === document.documentElement.getAttribute('data-code')
        )
      )
    }
  }, [selectedCode])

  useEffect(() => {
    let handler = () =>
      setSelectedCode(
        codes.find(
          (code) => code.value === (window.localStorage.code ?? 'java')
        )
      )

    window.addEventListener('storage', handler)

    return () => window.removeEventListener('storage', handler)
  }, [])

  return (
    <Listbox
      as="div"
      value={selectedCode}
      onChange={setSelectedCode}
      {...props}
    >
      <Listbox.Label className="sr-only">Language</Listbox.Label>
      <Listbox.Button
        className="flex h-6 w-6 items-center justify-center rounded-lg shadow-md shadow-black/5 ring-1 ring-black/5 dark:bg-slate-700 dark:ring-inset dark:ring-white/5"
        aria-label={selectedCode?.name}
      >
        <Image src={JavaColor.src} alt="Java" height={30} width={30}  className="hidden h-4 w-4 fill-sky-400 [[data-code=java]_&]:block" />
        <Image src={KotlinColor.src} alt="Kotlin" height={30} width={30}  className="hidden h-4 w-4 fill-sky-400 [[data-code=kotlin]_&]:block" />
      </Listbox.Button>
      <Listbox.Options className="absolute top-full left-1/2 mt-3 w-36 -translate-x-1/2 space-y-1 rounded-xl bg-white p-3 text-sm font-medium shadow-md shadow-black/5 ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/5">
        {codes.map((code) => (
          <Listbox.Option
            key={code.value}
            value={code}
            className={({ active, selected }) =>
              clsx(
                'flex cursor-pointer select-none items-center rounded-[0.625rem] p-1',
                {
                  'text-sky-500': selected,
                  'text-slate-900 dark:text-white': active && !selected,
                  'text-slate-700 dark:text-slate-400': !active && !selected,
                  'bg-slate-100 dark:bg-slate-900/40': active,
                }
              )
            }
          >
            {({ selected }) => (
              <>
                <div className="rounded-md bg-white p-1 shadow ring-1 ring-slate-900/5 dark:bg-slate-700 dark:ring-inset dark:ring-white/5">
                  <Image src={code.icon.src} alt={code.value} height={30} width={30} className={selected
                        ? 'h-4 w-4 fill-sky-400 dark:fill-sky-400'
                        : 'h-4 w-4 fill-slate-400'
                        } />
                </div>
                <div className="ml-3">{code.name}</div>
              </>
            )}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  )
}
