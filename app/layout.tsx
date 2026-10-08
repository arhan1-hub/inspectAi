import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata={title:'InspectAI — Asset inspection reports',description:'Document asset condition before disputes happen.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
