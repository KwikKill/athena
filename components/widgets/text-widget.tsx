"use client"

interface TextWidgetProps {
  config: {
    content?: string
    [key: string]: any
  }
}

export function TextWidget({ config }: TextWidgetProps) {
  const content = config?.content || "No content provided"

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />")
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(content) }} />
    </div>
  )
}
