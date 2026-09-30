import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 20, className = '' }) => (
  <Loader2 size={size} className={`animate-spin text-ink-400 ${className}`} />
);

export default Spinner;
