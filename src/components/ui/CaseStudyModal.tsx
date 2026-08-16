import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { CaseStudy } from "@/data/caseStudies"
import { Badge } from "@/components/ui/badge"

function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}

interface CaseStudyModalProps {
  caseStudy: CaseStudy
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CaseStudyModal({ caseStudy, open, onOpenChange }: CaseStudyModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const getStatusColor = (status: string) => {
    if (status === "Available Now") return "bg-green-500/10 text-green-500 border-green-500/20";
    if (status === "In Development") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    if (status === "On Request") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const Content = () => (
    <div className="flex flex-col gap-6 text-sm">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`font-mono text-[10px] tracking-wider uppercase rounded-full ${getStatusColor(caseStudy.status)}`}>
          {caseStudy.status}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase">The Challenge</h4>
        <p className="text-foreground leading-relaxed">{caseStudy.challenge}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
          {caseStudy.solutionLabel || "How This Works"}
        </h4>
        <p className="text-foreground leading-relaxed">{caseStudy.solution}</p>
      </div>

      <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg border border-border">
        <h4 className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-1">Before & After</h4>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <span className="text-muted-foreground font-medium shrink-0">Before:</span>
            <span className="text-muted-foreground italic">{caseStudy.beforeAfter.before}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-foreground font-medium shrink-0">After:</span>
            <span className="text-foreground font-medium">{caseStudy.beforeAfter.after}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          {caseStudy.resultsLabel || "What You'd Get"}
        </h4>
        <ul className="flex flex-col gap-2 list-disc list-inside text-foreground leading-relaxed marker:text-primary">
          {caseStudy.results.map((result, i) => (
            <li key={i}>{result}</li>
          ))}
        </ul>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground text-left">{caseStudy.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <Content />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="px-4 pt-4 pb-2 border-b border-border shrink-0">
          <DrawerTitle className="text-2xl font-bold tracking-tight text-foreground text-left">{caseStudy.title}</DrawerTitle>
        </div>
        <div className="p-4 overflow-y-auto">
          <Content />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
