export default function Hero({title, subtitle}:{title:string, subtitle?:string}){
  return (
    <section style={{padding:32,display:'flex',flexDirection:'column',gap:12}}>
      <h2 style={{margin:0}}>{title}</h2>
      {subtitle && <p style={{margin:0,opacity:0.9}}>{subtitle}</p>}
    </section>
  );
}
