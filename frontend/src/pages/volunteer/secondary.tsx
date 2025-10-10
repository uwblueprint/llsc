import React, { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';

interface Reference {
  name: string;
  email: string;
  phone: string;
}

export default function VolunteerSecondary() {
  const [currentStep, setCurrentStep] = useState(0);
  const [experience, setExperience] = useState('');
  const [references, setReferences] = useState<Reference[]>([
    { name: '', email: '', phone: '' },
    { name: '', email: '', phone: '' },
  ]);
  const [additionalComments, setAdditionalComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount =
    experience.trim() === ''
      ? 0
      : experience
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
  const MAX_WORDS = 300;

  const handleReferenceChange = (index: number, field: keyof Reference, value: string) => {
    const newReferences = [...references];
    newReferences[index][field] = value;
    setReferences(newReferences);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#056067';
    e.target.style.boxShadow = `0 0 0 2px rgba(5, 96, 103, 0.2)`;
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgb(209 213 219)';
    e.target.style.boxShadow = 'none';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const volunteerData = {
        experience,
        references_json: JSON.stringify(references),
        additional_comments: additionalComments,
      };

      const response = await fetch('/api/volunteer-data/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(volunteerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit volunteer data');
      }

      const result = await response.json();
      console.log('Volunteer data submitted successfully:', result);
      setCurrentStep(4); // Go to success page
    } catch (err) {
      console.error('Error submitting volunteer data:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 0: Setup Introduction
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm mx-auto text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 relative">
            <UserIcon className="w-8 h-8" style={{ color: '#056067' }} />
            {/* Checkmark overlay */}
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#056067' }}
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-gray-800 mb-4 leading-tight">
            Let's setup your public volunteer profile
          </h1>

          <p className="text-sm text-gray-600 mb-8 leading-relaxed">
            Your experience provided in this form will
            <br />
            be shared with potential matches.
          </p>

          <button
            onClick={() => setCurrentStep(1)}
            className="inline-flex items-center gap-2 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors"
            style={{ backgroundColor: '#056067' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#044950')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#056067')}
          >
            Continue
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Experience Form
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-white py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Volunteer Profile Form</h1>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex gap-2">
              <div className="flex-1 h-2 rounded" style={{ backgroundColor: '#056067' }}></div>
              <div className="flex-1 h-2 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Experience</h2>
              <p className="text-gray-600 mb-8">
                This information will serve as your biography to be shared with potential matches.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Tell us your story behind your diagnosis:
              </label>
              <textarea
                value={experience}
                onChange={(e) => {
                  const newText = e.target.value;
                  const newWordCount =
                    newText.trim() === ''
                      ? 0
                      : newText
                          .trim()
                          .split(/\s+/)
                          .filter((word) => word.length > 0).length;

                  if (newWordCount <= MAX_WORDS) {
                    setExperience(newText);
                  } else {
                    // If exceeding word limit, trim to exactly MAX_WORDS
                    const words = newText
                      .trim()
                      .split(/\s+/)
                      .filter((word) => word.length > 0);
                    const trimmedText = words.slice(0, MAX_WORDS).join(' ');
                    setExperience(trimmedText);
                  }
                }}
                placeholder="Type here...."
                className="w-3/5 h-56 p-4 border border-gray-300 rounded-lg resize-none outline-none bg-white text-gray-900 placeholder-gray-400"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                style={{ fontSize: '16px' }}
              />
              <div className="mt-3 w-3/5 flex justify-end">
                <span
                  className={`text-sm ${wordCount >= MAX_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {wordCount}/{MAX_WORDS} words
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 text-white text-sm font-medium py-3 px-6 rounded-lg transition-colors"
                style={{ backgroundColor: '#056067' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#044950')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#056067')}
              >
                Next Section
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: References Form
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-white py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Volunteer Profile Form</h1>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded"></div>
              <div className="flex-1 h-2 rounded" style={{ backgroundColor: '#056067' }}></div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <p className="text-gray-600 mb-8">
                These references will be used to confirm your alignment with the program.
              </p>
            </div>

            {/* Reference 1 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reference 1:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={references[0]?.name || ''}
                    onChange={(e) => handleReferenceChange(0, 'name', e.target.value)}
                    placeholder="John Doe"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white text-gray-900"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={references[0]?.email || ''}
                    onChange={(e) => handleReferenceChange(0, 'email', e.target.value)}
                    placeholder="john.doe@gmail.com"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white text-gray-900"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={references[0]?.phone || ''}
                    onChange={(e) => handleReferenceChange(0, 'phone', e.target.value)}
                    placeholder="###-###-####"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white text-gray-900"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
              </div>
            </div>

            {/* Reference 2 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reference 2:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={references[1]?.name || ''}
                    onChange={(e) => handleReferenceChange(1, 'name', e.target.value)}
                    placeholder="John Doe"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white text-gray-900"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={references[1]?.email || ''}
                    onChange={(e) => handleReferenceChange(1, 'email', e.target.value)}
                    placeholder="john.doe@gmail.com"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white text-gray-900"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={references[1]?.phone || ''}
                    onChange={(e) => handleReferenceChange(1, 'phone', e.target.value)}
                    placeholder="###-###-####"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white text-gray-900"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
              </div>
            </div>

            {/* Additional Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Anything else to share?
              </label>
              <textarea
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="Type here...."
                className="w-2/3 h-32 p-4 border border-gray-300 rounded-lg resize-none outline-none bg-white text-gray-900 placeholder-gray-400"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#056067' }}
                onMouseEnter={(e) =>
                  !isSubmitting && (e.currentTarget.style.backgroundColor = '#044950')
                }
                onMouseLeave={(e) =>
                  !isSubmitting && (e.currentTarget.style.backgroundColor = '#056067')
                }
              >
                {isSubmitting ? 'Submitting...' : 'Submit Volunteer Profile Form'}
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Success Page
  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="w-8 h-8" style={{ color: '#056067' }} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Success!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for sharing your references and experiences with us.
            </p>
            <div className="text-gray-600 space-y-2">
              <p>
                We will reach out in the next 5-7 business days with the next steps. For immediate
                help, please reach us at{' '}
                <a
                  href="mailto:FirstConnection@lls.org"
                  className="hover:opacity-80"
                  style={{ color: '#056067' }}
                >
                  FirstConnection@lls.org
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
}
