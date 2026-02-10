interface StarterPromptsProps {
  onSelect: (prompt: string) => void
}

const STARTER_PROMPTS = [
  'What should I budget for catering?',
  'How far in advance should I book vendors?',
  'What are the must-have vendor categories?',
  'Tips for choosing a venue in the Bay Area',
]

export function StarterPrompts({ onSelect }: StarterPromptsProps) {
  return (
    <div className="px-4 pb-3 space-y-2">
      <p className="text-xs text-[#888888] font-medium">Try asking:</p>
      <div className="flex flex-wrap gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            className="text-xs px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-full text-[#4A4A4A] hover:border-[#0F4C5C] hover:text-[#0F4C5C] transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default StarterPrompts
