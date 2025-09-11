interface LoadingStateProps {
  description?: string
}

interface ErrorStateProps {
  error?: string
}

export const LoadingState = ({ description = "Fetching data..." }: LoadingStateProps) => (
  <div className="bg-material-medium text-text-tertiary flex h-32 animate-pulse items-center justify-center rounded-lg text-sm">
    {description}
  </div>
)

export const ErrorState = ({ error = "An error occurred. Please try again." }: ErrorStateProps) => {
  return (
    <div className="bg-mix-red/background-1/4 text-text-tertiary flex h-32 items-center justify-center rounded-lg text-sm">
      {error}
    </div>
  )
}
