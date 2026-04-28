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
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface border-t border-border flex safe-bottom">
      {tabs.map(tab => {
        if (onNavAttempt) {
          return (
            <button
              key={tab.to}
              type="button"
              onClick={() => onNavAttempt(tab.to)}
              className="flex-1 flex flex-col items-center pt-1 pb-3 gap-1 text-xs text-muted relative"
            >
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-transparent" />
              <span className="text-lg leading-none mt-1">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        }

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center pt-1 pb-3 gap-1 text-xs transition-colors relative ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full transition-all ${
                    isActive ? 'bg-accent' : 'bg-transparent'
                  }`}
                />
                <span className="text-lg leading-none mt-1">{tab.icon}</span>
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
