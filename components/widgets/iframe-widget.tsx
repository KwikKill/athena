"use client"

interface IframeWidgetProps {
  config: {
    url?: string
    [key: string]: any
  }
}

export function IframeWidget({ config }: IframeWidgetProps) {
  const url = config?.url

  if (!url) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">No URL provided</div>
  }

  return (
    <div className="h-full">
      <iframe
        src={url}
        className="w-full h-full border-0 rounded"
        title="Embedded content"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}
