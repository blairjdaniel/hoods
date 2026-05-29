import Hero from '../../components/Hero';
import Footer from '../../components/Footer';
import dynamic from 'next/dynamic';

export const metadata = { title: 'Hoods DAO — Trait Swap' };

const TraitSwapClient = dynamic(() => import('../../components/TraitSwapClient'), { ssr: false });

export default function TraitSwapPage(){
  return (
    <div style={{maxWidth:1100,margin:'32px auto',padding:16}}>
      <Hero title="Trait Swap" subtitle="Swap traits between Hoods NFTs." />
      <main style={{padding:16}}>
        <section style={{padding:16,background:'rgba(255,255,255,0.02)',borderRadius:8}}>
          <h3>Trait Swap</h3>
          <p style={{opacity:0.85}}>Find Rogues collection NFTs owned by the connected wallet (devnet).</p>
          <TraitSwapClient />
        </section>
      </main>
      <Footer />
    </div>
  )
}
