import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',          label: 'Today',    icon: '✦' },
  { to: '/wardrobe',  label: 'Wardrobe', icon: '⊞' },
  { to: '/history',   label: 'History',  icon: '○' },
  { to: '/settings',  label: 'Settings', icon: '⋯' },
]

export default function BottomNav() {
  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface border-t border-border flex safe-bottom">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${
              isActive ? 'text-accent' : 'text-muted'
            }`
          }
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
