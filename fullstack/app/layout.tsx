import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'TutoConecta | Aprende acompañado',description:'Encuentra tu tutor, reserva un espacio y da el siguiente paso en tu aprendizaje.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
