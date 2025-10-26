"use client";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Share2, Eye, Settings } from "lucide-react";

export function BusinessCard() {
  const { data: contactData } = api.contact.get.useQuery();

  // Business card customization state
  const [businessCardFields, setBusinessCardFields] = useState({
    firstName: true,
    lastName: true,
    nickname: false,
    email: true,
    phoneNumber: true,
    company: true,
    instagram: false,
    discord: false,
    linkedin: false,
    pronouns: false,
    address: false,
  });

  // Contact data state
  const [contactInfo, setContactInfo] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    email: "",
    phoneNumber: "",
    company: "",
    instagram: "",
    discord: "",
    linkedin: "",
    pronouns: "",
    address: "",
  });

  // Update contact info when data loads
  useEffect(() => {
    if (contactData) {
      setContactInfo({
        firstName: contactData.firstName ?? "",
        lastName: contactData.lastName ?? "",
        nickname: contactData.nickname ?? "",
        email: contactData.email ?? "",
        phoneNumber: contactData.phoneNumber ?? "",
        company: contactData.company ?? "",
        instagram: contactData.instagram ?? "",
        discord: contactData.discord ?? "",
        linkedin: contactData.linkedin ?? "",
        pronouns: contactData.pronouns ?? "",
        address: contactData.address ?? "",
      });
    }
  }, [contactData]);

  const handleFieldToggle = (field: string) => {
    setBusinessCardFields(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handleShareCard = () => {
    const cardText = [
      `${contactInfo.firstName} ${contactInfo.lastName}`,
      businessCardFields.company && contactInfo.company ? contactInfo.company : '',
      businessCardFields.email && contactInfo.email ? contactInfo.email : '',
      businessCardFields.phoneNumber && contactInfo.phoneNumber ? contactInfo.phoneNumber : '',
      businessCardFields.linkedin && contactInfo.linkedin ? `LinkedIn: ${contactInfo.linkedin}` : '',
      businessCardFields.address && contactInfo.address ? contactInfo.address : ''
    ].filter(Boolean).join('\n');
    
    navigator.clipboard.writeText(cardText);
    toast.success("Business card copied to clipboard!");
  };

  return (
    <div className="rounded-xl bg-white/5 p-8 shadow-lg backdrop-blur-sm border border-white/10">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          
          <h2 className="text-xl font-bold text-black">Business Card Designer</h2>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          Customize your business card by selecting which information to include and see a live preview.
        </p>
      </div>
      
      <div className="space-y-8">
        {/* Customization Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Customize Fields</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(businessCardFields).map(([field, included]) => (
              <div 
                key={field} 
                onClick={() => handleFieldToggle(field)}
                className={`flex items-center space-x-3 cursor-pointer p-4 rounded-lg transition-all duration-200 border ${
                  included 
                    ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-400/50 shadow-md" 
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <span className="text-sm font-medium text-black capitalize">
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            
            <h3 className="text-lg font-semibold text-black">Live Preview</h3>
          </div>
          
          <div className="flex justify-center">
            <div className="relative group">
              <div className="bg-white rounded-xl shadow-2xl p-8 w-80 h-52 border border-gray-200 transform group-hover:scale-105 transition-all duration-300 hover:shadow-3xl">
                <div className="h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {businessCardFields.firstName && contactInfo.firstName} {businessCardFields.lastName && contactInfo.lastName}
                    </h3>
                    {businessCardFields.nickname && contactInfo.nickname && (
                      <p className="text-sm text-gray-600 mb-2 font-medium">"{contactInfo.nickname}"</p>
                    )}
                    {businessCardFields.company && contactInfo.company && (
                      <p className="text-sm font-semibold text-blue-600">{contactInfo.company}</p>
                    )}
                    {businessCardFields.pronouns && contactInfo.pronouns && (
                      <p className="text-xs text-gray-500 font-medium">{contactInfo.pronouns}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {businessCardFields.email && contactInfo.email && (
                      <p className="text-xs text-gray-600 font-medium">{contactInfo.email}</p>
                    )}
                    {businessCardFields.phoneNumber && contactInfo.phoneNumber && (
                      <p className="text-xs text-gray-600 font-medium">{contactInfo.phoneNumber}</p>
                    )}
                    {businessCardFields.linkedin && contactInfo.linkedin && (
                      <p className="text-xs text-blue-600 font-medium">LinkedIn: {contactInfo.linkedin}</p>
                    )}
                    {businessCardFields.instagram && contactInfo.instagram && (
                      <p className="text-xs text-pink-600 font-medium">Instagram: {contactInfo.instagram}</p>
                    )}
                    {businessCardFields.discord && contactInfo.discord && (
                      <p className="text-xs text-indigo-600 font-medium">Discord: {contactInfo.discord}</p>
                    )}
                    {businessCardFields.address && contactInfo.address && (
                      <p className="text-xs text-gray-600 font-medium">{contactInfo.address}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Live Preview
              </div>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              <span className="text-blue-400">✨</span> Customize your card and share with others
            </div>
            <Button
              onClick={handleShareCard}
              className="px-8 py-3 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Card
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
