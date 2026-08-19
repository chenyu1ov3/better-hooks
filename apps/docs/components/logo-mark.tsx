import type { SVGProps } from 'react';
import geometry from '../lib/brand-mark.json';

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={geometry.viewBox} fill="none" {...props}>
      <path
        className="logo-mark__structure"
        d={geometry.railPath}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
      />
      <path
        className="logo-mark__structure"
        d={geometry.loopsPath}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
      />
    </svg>
  );
}
