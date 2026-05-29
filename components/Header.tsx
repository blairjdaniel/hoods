import Link from 'next/link';
import dynamic from 'next/dynamic';
import R2Image from './R2Image';

const HeaderConnect = dynamic(() => import('./LandingConnect'), { ssr: false });

export default async function Header(){
  const logoFallback = '/logo.svg';

  return (
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 24px'}}>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <Link href="/">
          <R2Image objectKey="avatars/hoods_logo.png" bucket="hoodsdao" fallback={logoFallback} alt="Hoods DAO" style={{height:40,display:'block'}} />
        </Link>
      </div>
      <nav style={{display:'flex',gap:12,alignItems:'center'}}>
        <HeaderConnect showLogo={false} compact={true} singleButton={true} />
      </nav>
    </header>
  );
}
