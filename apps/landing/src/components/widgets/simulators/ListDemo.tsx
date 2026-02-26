import { ScrollArea } from '~/components/ui/scroll-areas/ScrollArea'

export const ListDemo = () => {
  return (
    <div className="flex flex-col min-w-0 select-none">
      {Items.map((item) => (
        <div
          key={item.title}
          className="py-3 pl-4 min-w-0 flex truncate max-w-full hover:bg-fill-secondary"
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={item.icon}
              alt={item.title}
              className="size-4 rounded-md"
            />
            <div className="flex flex-row min-w-0 items-center gap-2 truncate shrink">
              <h3 className="text-sm font-bold min-w-0 shrink truncate">
                {item.title}
              </h3>
              <p className="text-sm text-text-secondary min-w-0 truncate mr-1 shrink flex-1">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const Items: Array<{
  icon: string
  title: string
  description: string
}> = [
  {
    icon: '/icon-192x192.png',
    title: 'AI Safety vs Scalability',
    description: 'Why safety and scale can align in modern AI.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'The Cyber60 Podcast',
    description: 'Exploring how to build security in an AI-first world.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Robotics in Data Centers',
    description: 'Automating GPU server assembly to meet compute demand.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Horizontal Robotics Tools',
    description: 'Simulation platforms and sensor stacks for infra robots.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Sensor Data Infrastructure',
    description: 'Synchronizing multi-sensor data for robot training.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'AI Evolution Theme',
    description: 'A day of pieces tracing AI’s accelerating trajectory.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Leadership Debate',
    description: 'Why some say Stanford GSB isn’t the default for leaders.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Zcash and Privacy',
    description: 'A privacy-focused alternative in crypto conversations.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'AI Infrastructure Reshape',
    description: 'Raghu Raghuram on robots transforming infra buildouts.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Scalable Data Center Builds',
    description: 'Robots enable rapid assembly beyond human-only labor.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Simulation-Driven Robotics',
    description: 'Testing workflows virtually before real-world deployment.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Sensor Fusion Pipelines',
    description: 'Managing streams from cameras, lidar, and IMUs.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'AI x Security',
    description: 'Forging security practices in AI-powered environments.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Compute Supply Crunch',
    description: 'Demand for GPU clusters pushes automation forward.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Operational Tooling',
    description: 'Stacks to orchestrate and monitor robotics at scale.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Casual Daily Recap',
    description: 'Friendly overview of standout topics from your timeline.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'AI Safety Framing',
    description: 'Treating safety and capability as co-optimized goals.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Infra Stack New Layer',
    description: 'Robotics creates a fresh layer in the tech stack.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Podcast Signal: Cyber60',
    description: 'Expect deep dives into security in an AI era.',
  },
  {
    icon: '/icon-192x192.png',
    title: 'Nothing Else Stands Out?',
    description: 'When it’s quiet, the recap says so—naturally.',
  },
]

export const ListSkeletonDemo = () => {
  return (
    <div className="flex flex-col min-w-0 relative grow size-full">
      <div className="absolute inset-0">
        <ScrollArea rootClassName="size-full">
          {Array.from({ length: 20 }).map((_, index) => (
            <div
              key={index}
              className="py-3 pl-4 min-w-0 flex truncate max-w-full hover:bg-material-medium"
            >
              <div className="flex items-center gap-2 grow">
                <div className="size-4 rounded-md bg-fill-secondary" />
                <div className="flex flex-row grow items-center gap-2">
                  <h3 className="text-sm font-bold min-w-0 shrink flex-2 truncate">
                    <div className="w-full h-4 rounded-md bg-fill-secondary" />
                  </h3>
                  <div className="text-sm text-text-secondary min-w-0 truncate mr-2">
                    <div className="w-12 h-4 rounded-md bg-fill-secondary" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}
