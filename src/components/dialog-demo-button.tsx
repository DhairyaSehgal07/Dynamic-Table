import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  SlidersHorizontal,
  Columns3,
  Rows3,
  Calendar as CalendarIcon,
  GripVertical,
  X,
  ChevronDown
} from 'lucide-react'

// --- Mock Data for UI rendering ---
const columnsList = [
  { id: 'gatePass', label: 'Gate Pass Number', visible: true },
  { id: 'date', label: 'Date', visible: true },
  { id: 'farmer', label: 'Farmer Name', visible: true },
  { id: 'variety', label: 'Variety', visible: true },
  { id: 'bags', label: 'Bags', visible: true },
  { id: 'netWeight', label: 'Net Weight (kg)', visible: false },
  { id: 'status', label: 'Status', visible: true },
]

export function DialogDemoButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 text-slate-600 font-medium">
          <SlidersHorizontal className="h-4 w-4" />
          View & Filters
          {/* Active filter indicator badge */}
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] text-blue-700">
            3
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-white">

        {/* Header Section */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">
              Customize View
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Filter data, toggle columns, and group rows to fit your needs.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Tabs Section - The core of the elegant UI */}
        <Tabs defaultValue="filters" className="w-full">
          <div className="px-6 pt-4 border-b border-slate-100">
            <TabsList className="grid w-full grid-cols-3 h-11 bg-slate-100/50 p-1">
              <TabsTrigger value="filters" className="gap-2 text-sm">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </TabsTrigger>
              <TabsTrigger value="columns" className="gap-2 text-sm">
                <Columns3 className="h-4 w-4" /> Columns
              </TabsTrigger>
              <TabsTrigger value="grouping" className="gap-2 text-sm">
                <Rows3 className="h-4 w-4" /> Grouping
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: DATA FILTERS */}
          <div className="p-6 min-h-[320px] max-h-[60vh] overflow-y-auto">
            <TabsContent value="filters" className="m-0 space-y-6">

              {/* Date Range UI Mockup */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">Date Range</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="w-full justify-start text-left font-normal text-slate-600 h-10 border-slate-200">
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                    <span>Apr 01, 2026</span>
                  </Button>
                  <span className="text-slate-400 text-sm">to</span>
                  <Button variant="outline" className="w-full justify-start text-left font-normal text-slate-600 h-10 border-slate-200">
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                    <span>Apr 15, 2026</span>
                  </Button>
                </div>
              </div>

              {/* Status UI Mockup */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">Status</Label>
                <div className="flex gap-2">
                  <Button variant="secondary" className="h-8 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                    Graded
                  </Button>
                  <Button variant="outline" className="h-8 text-slate-500 border-slate-200 border-dashed">
                    Not Graded
                  </Button>
                </div>
              </div>

              {/* Multi-Select Variety Mockup */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">Variety</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md border-slate-200 bg-slate-50/50">
                  <Badge variant="secondary" className="bg-white border text-slate-700 font-medium px-2 py-1 flex items-center gap-1">
                    Basmati <X className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-pointer" />
                  </Badge>
                  <Badge variant="secondary" className="bg-white border text-slate-700 font-medium px-2 py-1 flex items-center gap-1">
                    Sharbati <X className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-pointer" />
                  </Badge>
                  <Button variant="ghost" className="h-6 px-2 text-xs text-slate-500 hover:text-slate-800">
                    + Add variety
                  </Button>
                </div>
              </div>

            </TabsContent>

            {/* TAB 2: COLUMN VISIBILITY */}
            <TabsContent value="columns" className="m-0">
              <div className="space-y-1">
                {columnsList.map((col) => (
                  <div key={col.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 border border-transparent transition-colors group">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-slate-300 cursor-grab group-hover:text-slate-400" />
                      <Label htmlFor={`col-${col.id}`} className="cursor-pointer text-sm font-medium text-slate-700">
                        {col.label}
                      </Label>
                    </div>
                    <Switch
                      id={`col-${col.id}`}
                      defaultChecked={col.visible}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 3: GROUPING */}
            <TabsContent value="grouping" className="m-0 space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">Row Grouping</Label>
                <div className="p-4 border rounded-md bg-slate-50 border-slate-200 border-dashed text-center space-y-3">
                  <Rows3 className="h-8 w-8 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-sm text-slate-600">Group your table rows by specific columns.</p>
                  </div>

                  {/* Mock Select Dropdown */}
                  <Button variant="outline" className="w-full sm:w-2/3 mx-auto flex justify-between bg-white text-slate-500 font-normal">
                    Select column to group by...
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-800 font-medium h-9 px-3">
            Reset to defaults
          </Button>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9">Cancel</Button>
            </DialogTrigger>
            <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              Apply Settings
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}

export { DialogDemoButton as AdvancedFilterDialog }