import Hero from '../../components/Hero';
import Footer from '../../components/Footer';

export const metadata = { title: 'Hoods DAO — Main' };

export default function MainPage(){
  return (
    <div style={{maxWidth:1100,margin:'32px auto',padding:16}}>
      <Hero title="Welcome to Hoods DAO" subtitle="A community-run DAO for on-chain art and swaps." />
      <main style={{padding:16}}>
        <section style={{padding:16,background:'rgba(255,255,255,0.02)',borderRadius:8}}>
          <h3>About</h3>
          <p style={{opacity:0.9}}>This is a minimal DApp skeleton. Use the Trait Swap for demo NFT trait swaps on Solana devnet.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
