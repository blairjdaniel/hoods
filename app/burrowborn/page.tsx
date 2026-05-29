import Hero from '../../components/Hero';
import Footer from '../../components/Footer';

export const metadata = { title: 'Burrowborn' };

export default function BurrowbornPage(){
  return (
    <div style={{maxWidth:1100,margin:'32px auto',padding:16}}>
      <Hero title="Burrowborn" subtitle="Link placeholder for Burrowborn content." />
      <main style={{padding:16}}>
        <section style={{padding:16,background:'rgba(255,255,255,0.02)',borderRadius:8}}>
          <h3>Burrowborn</h3>
          <p style={{opacity:0.85}}>Placeholder page for Burrowborn. Content to be added.</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
