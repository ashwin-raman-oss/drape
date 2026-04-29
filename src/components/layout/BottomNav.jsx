import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',         label: 'Today',    icon: '✦' },
  { to: '/wardrobe', label: 'Wardrobe', icon: '⊞' },
  { to: '/saved',    label: 'Saved',    icon: '◈' },
  { to: '/history',  label: 'History',  icon: '○' },
  { to: '/settings', label: 'Settings', icon: '⋯' },
]

export default function BottomNav({ onNavAttempt }) {
  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface border-t border-border flex safe-bottom h-16">
      {tabs.map(tab => {
        if (onNavAttempt) {
          return (
            <button
              key={tab.to}
              type="button"
              onClick={() => onNavAttempt(tab.to)}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-muted relative"
            >
              <span className="absolute top-0 left-0 right-0 h-px bg-transparent" />
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-[10px] tracking-widest uppercase font-medium">{tab.label}</span>
            </button>
          )
        }

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute top-0 left-0 right-0 h-px transition-all ${
                    isActive ? 'bg-accent' : 'bg-transparent'
                  }`}
                />
                <span className="text-lg leading-none">{tab.icon}</span>
                <span className="text-[10px] tracking-widest uppercase font-medium">{tab.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
