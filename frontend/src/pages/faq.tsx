import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { COLORS } from '@/constants/form';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  actionButton?: {
    text: string;
    action: () => void;
  };
}

const ACCENT_COLOR = '#056067';
const BORDER_COLOR_EXPANDED = '#5F989D';
const SHADOW_COLOR = '#B3CED1';

export default function FAQPage() {
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([]);
  const router = useRouter();
  const t = useTranslations('dashboard');

  const faqData: FAQItem[] = [
    {
      id: 'contact-staff',
      question: t('faqContactStaffQuestion'),
      answer: t('faqContactStaffAnswer'),
      actionButton: {
        text: t('faqContactUs'),
        action: () => true,
      },
    },
    {
      id: 'become-volunteer',
      question: t('faqBecomeVolunteerQuestion'),
      answer: t('faqBecomeVolunteerAnswer'),
      actionButton: {
        text: t('faqBecomeVolunteer'),
        action: () => router.push('/volunteer/intake'),
      },
    },
    {
      id: 'opt-out',
      question: t('faqOptOutQuestion'),
      answer: t('faqOptOutAnswer'),
      actionButton: {
        text: t('optOut'),
        action: () => true,
      },
    },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1 p-6">
        <div className="mx-auto" style={{ width: '620px' }}>
          <h1
            className="font-semibold"
            style={{
              color: COLORS.veniceBlue,
              fontSize: '36px',
              letterSpacing: '-0.5px',
              fontFamily: 'Open Sans, sans-serif',
              marginBottom: '48px',
            }}
          >
            {t('frequentlyAskedQuestions')}
          </h1>

          <div className="flex flex-col gap-4">
            {faqData.map((faq) => {
              const isOpen = expandedFAQs.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-lg transition-all duration-200 border"
                  style={{
                    borderColor: isOpen ? BORDER_COLOR_EXPANDED : '#e5e7eb',
                    borderWidth: 1,
                    boxShadow: isOpen
                      ? `0 0 0 4px ${SHADOW_COLOR}, 0 1px 2px rgba(10,13,18,0.05)`
                      : 'none',
                  }}
                >
                  <button
                    onClick={() =>
                      setExpandedFAQs((prev) =>
                        isOpen ? prev.filter((id) => id !== faq.id) : [...prev, faq.id],
                      )
                    }
                    className="w-full flex items-center justify-between py-4 px-5 bg-transparent border-none rounded-lg cursor-pointer text-left hover:bg-gray-50"
                  >
                    <span
                      style={{
                        color: COLORS.veniceBlue,
                        fontSize: '18px',
                        fontWeight: 600,
                        fontFamily: 'Open Sans, sans-serif',
                      }}
                    >
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <FiChevronUp color={COLORS.veniceBlue} size={24} />
                    ) : (
                      <FiChevronDown color={COLORS.veniceBlue} size={24} />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4">
                      <div
                        className="mb-4 whitespace-pre-wrap"
                        style={{
                          color: COLORS.veniceBlue,
                          fontSize: '16px',
                          fontWeight: 400,
                          fontFamily: 'Open Sans, sans-serif',
                        }}
                      >
                        {faq.answer}
                      </div>
                      {faq.actionButton && (
                        <button
                          onClick={faq.actionButton.action}
                          className="inline-flex items-center justify-center font-medium cursor-pointer text-white"
                          style={{
                            backgroundColor: ACCENT_COLOR,
                            border: `1px solid ${ACCENT_COLOR}`,
                            borderRadius: '8px',
                            padding: '8px 24px',
                            minHeight: '36px',
                            boxShadow: '0 1px 2px rgba(10,13,18,0.05)',
                            fontSize: '14px',
                            fontFamily: 'Open Sans, sans-serif',
                          }}
                        >
                          {faq.actionButton.text}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
