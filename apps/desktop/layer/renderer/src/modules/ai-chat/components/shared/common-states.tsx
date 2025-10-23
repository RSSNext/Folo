interface LoadingStateProps {
  description?: string
}

interface ErrorStateProps {
  error?: string
}

export const LoadingState = ({ description = "Fetching data..." }: LoadingStateProps) => (
  <div className="flex h-32 animate-pulse items-center justify-center rounded-lg bg-material-medium text-sm text-text-tertiary">
    {description}
  </div>
)

export const ErrorState = ({ error = "An error occurred. Please try again." }: ErrorStateProps) => {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg text-sm text-text-tertiary bg-mix-red/background-1/4">
      {error}
    </div>
  )
}
