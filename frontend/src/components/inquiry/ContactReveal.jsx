import { Phone, Mail } from 'lucide-react'

/**
 * ContactReveal displays vendor contact information after inquiry acceptance
 *
 * @param {Object} props
 * @param {Object} props.vendorProfile - Vendor profile with contact_email and contact_phone
 */
export function ContactReveal({ vendorProfile }) {
  if (!vendorProfile?.contact_email && !vendorProfile?.contact_phone) {
    return (
      <p className="text-sm text-[#888888]">
        Contact information not available
      </p>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="font-medium text-green-800 mb-2">Contact Information</h4>
      <div className="space-y-2 text-sm">
        {vendorProfile.contact_phone && (
          <a
            href={`tel:${vendorProfile.contact_phone}`}
            className="flex items-center gap-2 text-green-700 hover:underline"
          >
            <Phone className="w-4 h-4" />
            {vendorProfile.contact_phone}
          </a>
        )}
        {vendorProfile.contact_email && (
          <a
            href={`mailto:${vendorProfile.contact_email}`}
            className="flex items-center gap-2 text-green-700 hover:underline"
          >
            <Mail className="w-4 h-4" />
            {vendorProfile.contact_email}
          </a>
        )}
      </div>
    </div>
  )
}
