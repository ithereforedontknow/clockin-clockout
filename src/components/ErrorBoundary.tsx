import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  label?: string
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`,
      error.message,
      info.componentStack
    )
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-xl font-semibold">
            {this.props.label
              ? `${this.props.label} failed to load`
              : "Something went wrong"}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.error.message}
          </p>
          <Button onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
