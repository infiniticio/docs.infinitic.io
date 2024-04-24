import { MegaphoneIcon, XMarkIcon } from '@heroicons/react/24/outline'

const URL = "https://docs.infinitic.io/docs/community/releases#v0-13-0"
const TITLE_SMALL = "New version 0.13.0!"
const TITLE = "See what's new: CloudEvents and more "

export  function Banner() {
  return (
<div className="flex items-center gap-x-6 bg-pink-200 dark:bg-pink-800 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
  <p className="text-sm leading-6 text-black dark:text-white">
    <a href={ URL }>
      <strong className="font-semibold">{ TITLE_SMALL }</strong>
      <span className='sm:hidden'>
      <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true"></svg><span aria-hidden="true">&rarr;</span>
      </span>
      <span className='hidden sm:inline'>
        <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true"><circle cx="1" cy="1" r="1" /></svg>{ TITLE }&nbsp;<span aria-hidden="true">&rarr;</span>
      </span>
    </a>
  </p>
  <div className="flex flex-1 justify-end"></div>
</div>

  )
}
