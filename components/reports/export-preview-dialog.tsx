"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  Printer, 
  FileText, 
  FileSpreadsheet,
  FileJson,
  Eye,
  Settings,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ExportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportTitle: string
  reportSubtitle?: string
  children: React.ReactNode
  onExport?: (format: ExportFormat, options: ExportOptions) => void
  onPrint?: () => void
}

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json'

export interface ExportOptions {
  includeHeaders: boolean
  includeFooters: boolean
  paperSize: 'letter' | 'a4' | 'legal'
  orientation: 'portrait' | 'landscape'
  includeFilters: boolean
  includeTotals: boolean
}

const FORMAT_ICONS: Record<ExportFormat, typeof FileText> = {
  pdf: FileText,
  excel: FileSpreadsheet,
  csv: FileText,
  json: FileJson,
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: 'PDF Document',
  excel: 'Excel Spreadsheet',
  csv: 'CSV File',
  json: 'JSON Data',
}

export function ExportPreviewDialog({
  open,
  onOpenChange,
  reportTitle,
  reportSubtitle,
  children,
  onExport,
  onPrint,
}: ExportPreviewDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview')
  const [options, setOptions] = useState<ExportOptions>({
    includeHeaders: true,
    includeFooters: true,
    paperSize: 'letter',
    orientation: 'portrait',
    includeFilters: true,
    includeTotals: true,
  })
  const [isExporting, setIsExporting] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      onExport?.(format, options)
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      onOpenChange(false)
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    onPrint?.()
  }

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Export Preview
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'settings')} className="flex-1 flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 mt-4 overflow-hidden">
            <div 
              ref={previewRef}
              className={cn(
                "h-full overflow-auto border rounded-lg bg-white shadow-inner",
                options.orientation === 'landscape' && "aspect-[1.414]"
              )}
            >
              <div className="p-6 print:p-0">
                {/* Report Header */}
                {options.includeHeaders && (
                  <div className="text-center mb-6 print:mb-4">
                    <h1 className="text-xl font-bold">{reportTitle}</h1>
                    {reportSubtitle && (
                      <p className="text-sm text-muted-foreground">{reportSubtitle}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Generated on {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {/* Report Content */}
                <div className="print:text-sm">
                  {children}
                </div>

                {/* Report Footer */}
                {options.includeFooters && (
                  <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center print:mt-4">
                    <p>Page 1 of 1 | {reportTitle}</p>
                    <p>Confidential - For Internal Use Only</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Export Format */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Export Format</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((fmt) => {
                    const Icon = FORMAT_ICONS[fmt]
                    return (
                      <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                          format === fmt 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5",
                          format === fmt ? "text-primary" : "text-muted-foreground"
                        )} />
                        <div>
                          <p className="font-medium text-sm">{fmt.toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">{FORMAT_LABELS[fmt]}</p>
                        </div>
                        {format === fmt && (
                          <Check className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PDF Options */}
              {format === 'pdf' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">PDF Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="paper-size" className="text-sm">Paper Size</Label>
                      <Select 
                        value={options.paperSize} 
                        onValueChange={(v) => updateOption('paperSize', v as ExportOptions['paperSize'])}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="letter">Letter</SelectItem>
                          <SelectItem value="a4">A4</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="orientation" className="text-sm">Orientation</Label>
                      <Select 
                        value={options.orientation} 
                        onValueChange={(v) => updateOption('orientation', v as ExportOptions['orientation'])}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Content Options */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Content Options</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-headers" className="text-sm">Include Headers</Label>
                  <Switch
                    id="include-headers"
                    checked={options.includeHeaders}
                    onCheckedChange={(v) => updateOption('includeHeaders', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-footers" className="text-sm">Include Footers</Label>
                  <Switch
                    id="include-footers"
                    checked={options.includeFooters}
                    onCheckedChange={(v) => updateOption('includeFooters', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-filters" className="text-sm">Show Applied Filters</Label>
                  <Switch
                    id="include-filters"
                    checked={options.includeFilters}
                    onCheckedChange={(v) => updateOption('includeFilters', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-totals" className="text-sm">Include Totals</Label>
                  <Switch
                    id="include-totals"
                    checked={options.includeTotals}
                    onCheckedChange={(v) => updateOption('includeTotals', v)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
