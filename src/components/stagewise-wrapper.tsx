'use client';

import { useEffect } from 'react';

export function StagewiseWrapper() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@stagewise/toolbar').then((mod) => {
        mod.initToolbar({
          plugins: [],
          enabled: true
        });
      }).catch(console.error);
    }
  }, []);

  return null;
} 