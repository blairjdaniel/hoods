import Hero from '../../components/Hero';
import Footer from '../../components/Footer';

export const metadata = { title: 'Under The Hood' };

export default function UnderTheHoodPage(){
  return (
    <div style={{maxWidth:1100,margin:'32px auto',padding:16}}>
      <Hero title="Under The Hood" subtitle="Internal images and details." />
      <main style={{padding:16}}>
        <section style={{padding:16,background:'rgba(255,255,255,0.02)',borderRadius:8}}>
          <h3>Under The Hood</h3>
          <p style={{opacity:0.85}}>Placeholder page for Under The Hood content. Add details later.</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
