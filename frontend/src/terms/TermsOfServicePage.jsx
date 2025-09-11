import React, { useRef } from 'react';
import { ScrollProgress } from '@/Components/ui/scroll-progress';

export default function TermsOfServicePage() {
  const containerRef = useRef(null);

  const termsContent = Array.from({ length: 10 }, (_, i) => {
    const sections = [
      "Welcome to 180Connect, a client outreach and relationship management platform developed by 180 Degrees Consulting Sheffield. By accessing or using this platform, you agree to be bound by these Terms of Service. 180Connect is an internal platform designed for use by team members of 180 Degrees Consulting Sheffield to manage outreach efforts, client data, and email communications.",
      "Only current members of 180 Degrees Consulting Sheffield are permitted to create and use an account. You are responsible for maintaining the confidentiality of your login credentials. We reserve the right to suspend or terminate accounts for misuse or violation of these terms.",
      "The platform collects and stores data related to client organizations, including names, emails, addresses, and outreach history. All data is used exclusively for consulting-related outreach purposes. We strive to comply with applicable data protection laws, including the UK GDPR.",
      "The app uses predefined templates and the official branch email address (sheffield@180dc.org) for outreach. Users may not send unauthorized or inappropriate messages through the platform. We are not responsible for user-modified email content.",
      "You may not use the platform to harass, impersonate, or spam organizations or individuals. Do not attempt to reverse-engineer, extract, or copy platform code or data. You must use the platform only for legitimate, approved outreach activities.",
      "All platform content, code, and email templates are the property of 180 Degrees Consulting Sheffield unless stated otherwise. Redistribution or commercial use without written permission is prohibited.",
      "The platform is provided 'as is' without warranties of any kind. We do not guarantee uptime, bug-free performance, or the accuracy of email delivery.",
      "We are not liable for any damages resulting from misuse, data loss, or communication errors caused by use of the platform. You use the platform at your own risk.",
      "We may update these Terms of Service from time to time. Continued use of the platform after changes means you accept the new terms.",
      "For questions or concerns, please contact us at sheffield@180dc.org."
    ];
    
    return (
      <p key={i} className="pb-4 font-mono text-sm text-zinc-500">
        {sections[i]}
      </p>
    );
  });

  return (
    <div className="h-screen overflow-auto px-8 pb-16 pt-16 bg-white" ref={containerRef}>
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-12 w-full bg-white to-transparent backdrop-blur-xl [-webkit-mask-image:linear-gradient(to_top,white,transparent)]" />
      <div className="pointer-events-none absolute left-0 top-0 w-full">
        <div className="absolute left-0 top-0 h-1 w-full bg-[#E6F4FE]" />
        <ScrollProgress containerRef={containerRef} className="absolute top-0 bg-[#0090FF]" />
      </div>
      {termsContent}
    </div>
  );
}
