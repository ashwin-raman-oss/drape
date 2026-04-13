export default function MobileLayout({ children, className = '' }) {
  return (
    <div className={`max-w-md mx-auto min-h-screen bg-bg flex flex-col ${className}`}>
      {children}
    </div>
  )
}
