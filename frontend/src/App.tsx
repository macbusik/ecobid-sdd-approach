function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            EcoBid
          </h1>
          <p className="text-2xl text-gray-600 mb-2">
            Freecycling Made Simple
          </p>
          <p className="text-lg text-gray-500">
            Give away items. Find what you need. Build community.
          </p>
        </div>

        <div className="bg-green-100 border-2 border-green-400 text-green-800 px-6 py-4 rounded-lg mb-6 inline-block">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Infrastructure Deployed Successfully!</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">What's Next?</h2>
          <ul className="text-left space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Smart Give Flow with AI-powered image recognition</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Reservation Queue system (no bidding wars!)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Seek & Match engine for automatic notifications</span>
            </li>
          </ul>
        </div>

        <footer className="text-sm text-gray-500">
          <p className="mb-1">🌱 AWS Free Tier Optimized</p>
          <p>Built with React, Vite, Tailwind CSS & AWS Serverless</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
