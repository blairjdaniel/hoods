"use client";
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Replace with the real Rogues collection mint when available (devnet placeholder)
const ROGUES_COLLECTION = 'RogueColl1111111111111111111111111111111111';

type NFTItem = {
  mint?: string;
  metadata?: any;
  content?: any;
};

export default function TraitSwapClient(){
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const useFake = typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_USE_FAKE_ROGUES === 'true');

  useEffect(() => {
    if (!connected || !publicKey) {
      setNfts([]);
      return;
    }

    let mounted = true;
    const fetchNfts = async () => {
      setLoading(true);
      setError(null);
      try{
        if (useFake) {
          // load mock metadata from public/mock-rogues
          const idx = await fetch('/mock-rogues/index.json');
          if (!idx.ok) throw new Error('failed to load mock index');
          const list: string[] = await idx.json();
          const items: NFTItem[] = [];
          for (const p of list) {
            try{
              const r = await fetch(p);
              if (!r.ok) continue;
              const meta = await r.json();
              items.push({ mint: meta.mint || meta.name, metadata: meta, content: meta });
            }catch(e){ continue; }
          }
          if (mounted) setNfts(items);
          return;
        }
        const res = await fetch(`/api/helius/nfts?owner=${publicKey.toBase58()}`);
        if (!res.ok) throw new Error(`helius fetch failed ${res.status}`);
        const data = await res.json();
        // Filter by collection (Helius may include collection info in metadata or content)
        const owned = Array.isArray(data) ? data : data?.nfts || [];
        const filtered = owned.filter((it: any) => {
          const coll = it?.metadata?.collection || it?.content?.metadata?.collection || it?.collection;
          const collKey = coll?.key || coll?.address || coll?.verified?.address || coll;
          if (!collKey) return false;
          return String(collKey).includes(ROGUES_COLLECTION) || String(collKey) === ROGUES_COLLECTION;
        }).map((it: any) => ({ mint: it?.mint || it?.tokenAddress || it?.id, metadata: it?.metadata || it?.content?.metadata || it, content: it?.content }));
        if (mounted) setNfts(filtered);
      }catch(e:any){
        if (mounted) setError(e?.message || String(e));
      }finally{ if (mounted) setLoading(false); }
    };

    fetchNfts();
    return () => { mounted = false; };
  }, [connected, publicKey]);

  return (
    <section style={{padding:16,background:'rgba(255,255,255,0.02)',borderRadius:8,marginTop:12}}>
      <h4>Owned Rogues NFTs (devnet)</h4>
      {!connected && <div style={{opacity:0.8}}>Connect your wallet to see owned Rogues NFTs.</div>}
      {connected && loading && <div>Checking Helius for NFTs…</div>}
      {error && <div style={{color:'salmon'}}>{error}</div>}
      {connected && !loading && nfts.length === 0 && <div style={{opacity:0.8}}>No Rogues NFTs found for this wallet (devnet fakes).</div>}
      {nfts.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginTop:12}}>
          {nfts.map((n) => {
            const image = n.metadata?.image || n.content?.metadata?.image || n.metadata?.content?.image || n.metadata?.data?.image;
            const title = n.metadata?.name || n.content?.metadata?.name || n.mint;
            return (
              <div key={n.mint} style={{padding:8,background:'#0b0b0b',border:'1px solid #222',borderRadius:8}}>
                {image ? <img src={image} alt={title} style={{width:'100%',height:140,objectFit:'cover',borderRadius:6}} /> : <div style={{height:140,background:'#111',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',color:'#666'}}>No image</div>}
                <div style={{marginTop:8,fontSize:13}}>{title}</div>
                <div style={{fontSize:12,opacity:0.8}}>{n.mint}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
