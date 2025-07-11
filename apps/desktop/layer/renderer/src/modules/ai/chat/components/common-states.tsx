import { Card, CardContent, CardHeader, CardTitle } from "@follow/components/ui/card/index.js"

interface LoadingStateProps {
  title?: string
  description?: string
  maxWidth?: string
}

interface ErrorStateProps {
  title?: string
  error?: string
  maxWidth?: string
}

export const LoadingState = ({
  title = "Loading...",
  description = "Fetching data...",
  maxWidth = "max-w-4xl",
}: LoadingStateProps) => (
  <Card className={`mx-auto mb-2 w-full ${maxWidth}`}>
    <CardHeader>
      <CardTitle className="text-text flex items-center gap-2 text-xl font-semibold">
        <span className="text-lg">⏳</span>
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="bg-material-medium text-text-tertiary flex h-32 animate-pulse items-center justify-center rounded-lg text-sm">
        {description}
      </div>
    </CardContent>
  </Card>
)

export const ErrorState = ({
  title = "Error",
  error = "An error occurred. Please try again.",
  maxWidth = "max-w-4xl",
}: ErrorStateProps) => {
  return (
    <Card className={`border-red mx-auto mb-2 w-full ${maxWidth}`}>
      <CardHeader className="py-4">
        <CardTitle className="text-red flex items-center gap-2 text-xl font-semibold">
          <span className="text-lg">⚠️</span>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-text-secondary text-sm">{error}</div>
      </CardContent>
    </Card>
  )
}
