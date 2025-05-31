import Image from 'next/image';

export default function AppScreenshots() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Modern Interface</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Beautiful and Intuitive Design
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Our modern interface combines powerful features with ease of use, making coin collection management a breeze.
          </p>
        </div>

        {/* Main Dashboard Screenshot */}
        <div className="mt-16 flow-root sm:mt-20">
          <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 dark:bg-gray-800/50 dark:ring-gray-700 lg:-m-4 lg:rounded-2xl lg:p-4">
            <div className="relative aspect-[16/9] rounded-xl shadow-2xl ring-1 ring-gray-900/10 dark:ring-gray-700 overflow-hidden">
              <Image
                src="/images/dashboard-screenshot.png"
                alt="Dashboard showing collection overview with world map and statistics"
                fill
                className="object-contain"
                priority
                quality={95}
                sizes="(min-width: 1024px) 64rem, 100vw"
              />
            </div>
          </div>
        </div>

        {/* Collection and Analysis Screenshots */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2">
          <div className="relative aspect-[4/3] rounded-xl shadow-2xl ring-1 ring-gray-900/10 dark:ring-gray-700 overflow-hidden">
            <Image
              src="/images/collection-screenshot.png"
              alt="Collection management interface showing detailed coin listings"
              fill
              className="object-contain"
              quality={95}
              sizes="(min-width: 640px) 32rem, 100vw"
            />
          </div>
          <div className="relative aspect-[4/3] rounded-xl shadow-2xl ring-1 ring-gray-900/10 dark:ring-gray-700 overflow-hidden">
            <Image
              src="/images/analysis-screenshot.png"
              alt="Analytics dashboard with collection statistics and charts"
              fill
              className="object-contain"
              quality={95}
              sizes="(min-width: 640px) 32rem, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
} 