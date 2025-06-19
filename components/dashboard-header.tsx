import { GraduationCap } from "lucide-react"

export default function DashboardHeader() {
  return (
    <div className="flex items-center space-x-2">
      <GraduationCap className="h-8 w-8 text-primary" />
      <div>
        <h1 className="text-2xl font-bold">StudySync</h1>
        <p className="text-muted-foreground">Your College Task & Schedule Manager</p>
      </div>
    </div>
  )
}
