import React from 'react';

export const QrCodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h4v4H4V4zm8 0h4v4h-4V4zM4 12h4v4H4v-4zm8 0h4v4h-4v-4z" />
  </svg>
);