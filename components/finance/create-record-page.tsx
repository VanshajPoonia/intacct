"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ModulePage } from "@/components/layout/module-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { BreadcrumbItem } from "@/components/navigation/breadcrumbs"

interface CreateRecordPageProps {
  title: string
  description: string
  breadcrumbs: BreadcrumbItem[]
  backHref: string
  backLabel: string
  formTitle: string
  formDescription?: string
  children: ReactNode
  rail?: ReactNode
}

export function CreateRecordPage({
  title,
  description,
  breadcrumbs,
  backHref,
  backLabel,
  formTitle,
  formDescription,
  children,
  rail,
}: CreateRecordPageProps) {
  return (
    <ModulePage
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{formTitle}</CardTitle>
            {formDescription ? <CardDescription>{formDescription}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {rail ? <div className="space-y-4">{rail}</div> : null}
      </div>
    </ModulePage>
  )
}
