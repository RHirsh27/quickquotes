'use client'

import { validatePassword } from '@/lib/utils/validation'

interface PasswordStrengthProps {
  password: string
  showFeedback?: boolean
}

export function PasswordStrength({ password, showFeedback = true }: PasswordStrengthProps) {
  if (!password) return null

  const { strength, feedback } = validatePassword(password)

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  }

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  }

  const strengthWidth = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full',
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColors[strength]} ${strengthWidth[strength]}`}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength === 'weak' ? 'text-red-600' :
          strength === 'medium' ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {strengthLabels[strength]}
        </span>
      </div>
      {showFeedback && feedback.length > 0 && (
        <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
          {feedback.slice(0, 3).map((item, index) => (
            <li key={index}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

