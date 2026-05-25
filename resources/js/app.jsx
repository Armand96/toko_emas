import { createRoot } from 'react-dom/client'
import '../css/app.css'
import Layout from './components/layout/Layout'
import { RouterProvider } from 'react-router'
import router from './router'

function App() {
  return (
    // <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    //   <h1 className="text-3xl font-bold text-blue-600">
    //   appppppp 🎉
    //   </h1>
    // </div>
   <RouterProvider router={router} />
  )
}

const root = createRoot(document.getElementById('app'))
root.render(<App />)
