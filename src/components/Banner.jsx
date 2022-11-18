import { MegaphoneIcon, XMarkIcon } from '@heroicons/react/24/outline'

const URL = "https://infinitic.substack.com/p/state-of-infinitic-v0112"
const TITLE_SMALL = "New version 0.11.2!"
const TITLE = "Version 0.11.2 released! What's new for Infinitic and what's next."

export  function Banner() {
  return (
    <>
      <div className="inset-x-0 bottom-0">
        <div className="bg-slate-900 dark:bg-slate-800">
          <div className="mx-auto max-w-7xl py-3 px-3 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex w-0 flex-1 items-center">
                <span className="flex rounded-lg bg-blue-800 p-2">
                  <MegaphoneIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
                <p className="ml-3 truncate font-medium text-white">
                  <span className="md:hidden">{ TITLE_SMALL }</span>
                  <span className="hidden md:inline">{ TITLE }</span>
                </p>
              </div>
              <div className="order-3 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
                <a
                  href={ URL }
                  className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-indigo-50"
                >
                  <span className='sm:hidden'>{TITLE_SMALL}</span>
                  <span className='hidden sm:inline'>Learn More</span>
                </a>
              </div>
            </div> 
          </div>
        </div>
      </div>
    </>
  )
}
