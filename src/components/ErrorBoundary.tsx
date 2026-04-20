import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

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
        <div className="flex min-h-[400px] animate-in flex-col items-center justify-center p-20 duration-700 fade-in">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-red-100 bg-red-50 shadow-inner">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div className="mb-8 space-y-2 text-center">
            <p className="text-[10px] font-black tracking-[0.3em] text-red-600/60 uppercase">
              Module Fault Detected
            </p>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {this.props.label
                ? `${this.props.label} encountered an error`
                : "Application Error"}
            </h2>
            <p className="max-w-md text-sm leading-relaxed font-medium text-slate-500 italic">
              "{this.state.error.message}"
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="font-bold shadow-sm"
              onClick={() => window.location.reload()}
            >
              Hard Reload
            </Button>
            <Button
              className="font-bold shadow-md"
              onClick={() => this.setState({ error: null })}
            >
              Attempt Recovery
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
