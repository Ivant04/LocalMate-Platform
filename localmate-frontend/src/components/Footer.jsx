import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full py-12 px-6 md:px-10 bg-surface-container-highest border-t border-border-subtle mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <div className="font-headline-md text-headline-md font-bold text-primary mb-4">LocalMate</div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
            © 2026 LocalMate. Connecting worlds, one guide at a time. Join our community of explorers and local experts.
          </p>
        </div>
        <div>
          <h4 className="font-label-bold text-label-bold text-on-surface mb-4">Platform</h4>
          <ul className="space-y-2">
            <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Guide Guidelines</a></li>
            <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Safety Center</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-label-bold text-label-bold text-on-surface mb-4">Legal</h4>
          <ul className="space-y-2">
            <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
            <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
