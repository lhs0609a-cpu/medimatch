'use client'

import { Building2, Phone, ExternalLink } from 'lucide-react'
import type { ContactInfo } from '@/app/checklist/data/task-guides'

interface ContactListProps {
  contacts: ContactInfo[]
}

export default function ContactList({ contacts }: ContactListProps) {
  if (!contacts || contacts.length === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>담당 기관 연락처</span>
      </div>
      <div className="grid gap-1.5">
        {contacts.map((contact, i) => (
          <div
            key={i}
            className="flex items-start gap-2 bg-secondary/30 rounded-lg px-3 py-2"
          >
            <Building2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-600" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground">
                {contact.organization}
                {contact.department && (
                  <span className="text-muted-foreground font-normal"> · {contact.department}</span>
                )}
              </div>
              {contact.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{contact.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone.replace(/-/g, '')}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    {contact.phone}
                  </a>
                )}
                {contact.url && (
                  <a
                    href={contact.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                  >
                    웹사이트
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
