import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { BarChart3, Zap, Brain, Lightbulb, Target, Shield } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between mx-auto container">
          <div className="flex items-center gap-3 text-primary">
            <Shield className="h-8 w-8" />
            <span className="text-2xl font-bold font-sans">Athena</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-24 md:py-32 bg-gradient-to-br from-background via-card/30 to-secondary/20">
          <div className="mx-auto container max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <Shield className="h-20 w-20 text-primary mx-auto mb-4" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl font-sans text-balance">
              Transform data into <span className="text-primary">wisdom</span> with intelligent dashboards
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto font-serif text-pretty">
              This project is a grafana lite built for REST API data sources. Connect to any API, visualize data with
              smart widgets, and share insights with ease.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/signup">
                <Button size="lg" className="h-12 px-8 font-sans">
                  Begin your journey
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="h-12 px-8 bg-transparent font-sans">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card">
          <div className="mx-auto container max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold font-sans mb-4">custom dashboard creation</h2>
              <p className="text-muted-foreground font-serif max-w-2xl mx-auto">
                Build dashboards from any REST API in minutes.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-sans">Intelligent Visualization</h3>
                <p className="text-muted-foreground font-serif">
                  Create stunning charts, tables, and KPI cards that reveal the story hidden in your data
                </p>
              </div>
              <div className="text-center group">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-sans">Smart Integration</h3>
                <p className="text-muted-foreground font-serif">
                  Connect to any REST API and transform data with intelligent rules and custom logic
                </p>
              </div>
              <div className="text-center group">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-sans">Strategic Insights</h3>
                <p className="text-muted-foreground font-serif">
                  Share dashboards with precision and manage access with the wisdom of strategic planning
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-card/30">
        <div className="mx-auto container text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <p className="font-serif">
              &copy; {new Date().getFullYear()}
            </p>
            <Shield className="h-4 w-4 text-primary" />
            <p className="font-serif">
              Athena By
            </p>
            <a
              href="https://gabriel.blaisot.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif underline text-primary transition-colors hover:text-primary/70"
            >
              Gabriel Blaisot - KwikKill
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
