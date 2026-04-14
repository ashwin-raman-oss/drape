export default function UploadStep2() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-primary font-light">Analysing your item...</p>
      <p className="text-muted text-sm text-center px-8">Claude is reading the label and style details</p>
    </div>
  )
}
