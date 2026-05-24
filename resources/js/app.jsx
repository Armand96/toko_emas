import { createRoot } from 'react-dom/client'
import '../css/app.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <h1 className="text-3xl font-bold text-blue-600">
      appppppp 🎉
      </h1>
    </div>
  )
}

const root = createRoot(document.getElementById('app'))
root.render(<App />)
