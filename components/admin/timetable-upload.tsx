"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileSpreadsheet, Check, AlertCircle, Download } from "lucide-react"
import { useSharedData } from "@/lib/context/shared-data-context"

export default function TimeTableUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const { toast } = useToast()
  const { uploadTimeTable, syncTimeTableToStudents } = useSharedData()

  const processCSVData = (text: string) => {
    const lines = text.split("\n")
    const headers = lines[0].split(",")

    // Find the index of each required column
    const codeIndex = headers.findIndex((h) => h.toLowerCase().includes("code"))
    const nameIndex = headers.findIndex((h) => h.toLowerCase().includes("name") || h.toLowerCase().includes("subject"))
    const dayIndex = headers.findIndex((h) => h.toLowerCase().includes("day"))
    const startTimeIndex = headers.findIndex((h) => h.toLowerCase().includes("start"))
    const endTimeIndex = headers.findIndex((h) => h.toLowerCase().includes("end"))
    const professorIndex = headers.findIndex((h) => h.toLowerCase().includes("professor"))
    const roomIndex = headers.findIndex((h) => h.toLowerCase().includes("room") || h.toLowerCase().includes("location"))

    // Process data rows
    const entries = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(",")

      // Create entry with default values for missing fields
      const entry = {
        subject: nameIndex >= 0 ? values[nameIndex].trim() : `Course ${i}`,
        day: dayIndex >= 0 ? values[dayIndex].trim() : "Monday",
        startTime: startTimeIndex >= 0 ? values[startTimeIndex].trim() : "09:00",
        endTime: endTimeIndex >= 0 ? values[endTimeIndex].trim() : "10:30",
        professor: professorIndex >= 0 ? values[professorIndex].trim() : "N/A",
        location: roomIndex >= 0 ? values[roomIndex].trim() : "N/A",
      }

      entries.push(entry)
    }

    return entries
  }

  const processExcelData = async (arrayBuffer: ArrayBuffer) => {
    try {
      // This is a placeholder for Excel processing
      // In a real implementation, you would use a library like xlsx or exceljs
      // For now, we'll just convert to CSV-like format for demonstration
      const decoder = new TextDecoder("utf-8")
      const text = decoder.decode(arrayBuffer)

      // For demo purposes, we'll just process it as CSV
      return processCSVData(text)
    } catch (error) {
      console.error("Error processing Excel data:", error)
      throw new Error("Failed to process Excel file")
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Check if file is Excel or CSV
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
        setUploadStatus("error")
        setErrorMessage("Please upload an Excel file (.xlsx or .xls) or CSV file (.csv)")
        return
      }

      // Start upload process
      setUploading(true)
      setUploadProgress(0)

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      try {
        // Read the file content
        const fileContent = await file.arrayBuffer()

        let entries
        if (file.name.endsWith(".csv")) {
          const text = new TextDecoder().decode(fileContent)
          entries = processCSVData(text)
        } else {
          entries = await processExcelData(fileContent)
        }

        if (!entries || entries.length === 0) {
          throw new Error("No valid entries found in the file")
        }

        // Ask user if they want to replace or merge the timetable
        const confirmAction = confirm(
          "Do you want to replace your existing timetable with the uploaded one? Click 'OK' to replace or 'Cancel' to merge with your existing schedule.",
        )

        // Use our new uploadTimeTable function
        const success = await uploadTimeTable(entries, confirmAction)

        if (success) {
          // Sync to students
          await syncTimeTableToStudents()

          setUploadStatus("success")
        } else {
          throw new Error("Failed to upload timetable")
        }

        setUploadProgress(100)
      } catch (error) {
        console.error("Error processing file:", error)
        setUploadStatus("error")
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to process the file. Please check the format and try again.",
        )
      } finally {
        clearInterval(interval)
        setUploadProgress(100)
        setUploading(false)

        // Reset after 5 seconds
        setTimeout(() => {
          if (uploadStatus === "success") {
            setUploadStatus("idle")
          }
        }, 5000)
      }
    },
    [uploadStatus, uploadTimeTable, syncTimeTableToStudents, toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  const downloadTemplate = () => {
    const csvContent = `Subject,Day,StartTime,EndTime,Professor,Location
Mathematics,Monday,09:00,10:30,Dr. Johnson,Room 101
Physics,Monday,11:00,12:30,Dr. Smith,Science Building
Computer Science,Tuesday,14:00,15:30,Prof. Williams,Tech Lab
Mathematics,Wednesday,09:00,10:30,Dr. Johnson,Room 101
History,Thursday,13:00,14:30,Dr. Davis,Humanities Building
Physics,Friday,11:00,12:30,Dr. Smith,Science Building`

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "timetable_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Template downloaded",
      description: "The CSV template has been downloaded",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Upload Timetable</h2>
        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      <p className="text-muted-foreground">
        Upload a schedule in CSV or Excel format to quickly add multiple courses. You can download a template to get
        started.
      </p>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 bg-primary/10 rounded-full">
            {uploading ? (
              <FileSpreadsheet className="h-8 w-8 text-primary animate-pulse" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {isDragActive ? "Drop the file here" : "Drag & drop your file here, or click to browse"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Supports .csv, .xlsx, and .xls files</p>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading and processing...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {uploadStatus === "success" && (
        <Alert variant="default" className="bg-success text-success-foreground">
          <Check className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>The timetable has been successfully uploaded and processed.</AlertDescription>
        </Alert>
      )}

      {uploadStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Instructions</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Prepare your timetable in CSV or Excel format</li>
          <li>Include columns for Subject, Day, StartTime, EndTime, Professor, and Location</li>
          <li>Use the template for the correct format</li>
          <li>Upload the file using the drag & drop area above</li>
          <li>Choose to replace or merge with your existing timetable</li>
        </ul>
      </div>
    </div>
  )
}
