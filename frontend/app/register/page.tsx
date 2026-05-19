import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  return (
    <main>
      <div className="shell">
        <section className="hero">
          <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
              <RegisterForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
