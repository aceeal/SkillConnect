'use client';

export default function TermsOfServicePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
      }}
    >
      <div className="max-w-4xl w-full bg-white shadow-xl rounded-xl p-8 transition-all duration-300 hover:shadow-2xl">
        <h1 className="text-3xl font-bold text-black mb-6">Terms of Service</h1>

        <p className="text-gray-700 mb-6">
          Welcome to SkillConnect! These Terms of Service govern your use of our platform. By using SkillConnect, you agree to comply with these Terms.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-semibold text-black mb-4">User Responsibilities</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Provide accurate account information</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Maintain the security of your account</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Use the platform only for lawful purposes</span>
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-black mt-6 mb-4">Intellectual Property</h2>
            <p className="text-gray-700">
              All content on SkillConnect is the property of SkillConnect or its licensors and is protected by intellectual property laws. You may not reproduce or distribute this content without prior written consent.
            </p>
          </div>

          {/* Right column */}
          <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-semibold text-black mb-4">Service Usage</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Don't engage in disruptive activities</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Changes to Terms will be posted on this page</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Continued use means acceptance of updated Terms</span>
              </li>
            </ul>

            <div className="bg-blue-600 text-white rounded-lg p-6 shadow-md transform transition-all duration-300 hover:scale-105 mt-6">
              <h2 className="text-xl font-semibold mb-4">Important Notices</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-white mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>SkillConnect is provided "as is" without warranties</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-white mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>We may terminate access for Terms violations</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-white mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>These Terms are governed by Texas law</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-gray-600 text-sm animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <p className="flex items-center justify-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Effective Date: March 24, 2025
          </p>
        </div>
      </div>
    </div>
  );
}

/* Make sure to add these animation styles to your global CSS file if not already added */
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
*/