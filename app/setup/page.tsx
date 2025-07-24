import SetupInstructions from "@/components/setup-instructions"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-100">
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">Multi-Stop Route Optimizer Setup</h1>
          <p className="mt-2 opacity-90">Complete setup guide for the desert route optimization app</p>
        </div>
      </div>
      <div className="py-8">
        <SetupInstructions />
      </div>
    </div>
  )
}
