"use client";
import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

type Props = { showLogo?: boolean; compact?: boolean; singleButton?: boolean };

export default function LandingConnect({ showLogo = true, compact = false, singleButton = false }: Props){
  const { wallets, select, connect, publicKey, connected, disconnect, connecting, disconnecting } = useWallet();
  const [error,setError] = useState<string | null>(null);

  const shortKey = (key: any) => {
    try{
      const s = key.toBase58();
      return s.slice(0,6) + '..' + s.slice(-4);
    }catch(e){ return String(key) }
  };

  const handleConnect = async () => {
    setError(null);
    try{
      if (!wallets || wallets.length === 0) {
        setError('No wallet adapters available. Install Phantom: https://phantom.app/');
        return;
      }
      // Prefer Phantom if present
      const preferred = wallets.find(w => /phantom/i.test(((w as any).name || (w as any).adapter?.name || ''))) || wallets[0];
      if (preferred) {
        const nameToSelect = (preferred as any).name || (preferred as any).adapter?.name;
        if (nameToSelect) {
          try { await select(nameToSelect); } catch (_) { /* ignore */ }
        }
      }
      await connect();
    }catch(e:any){
      // Log full error for debugging
      console.error('wallet connect error', e);
      const name = (e && typeof e === 'object' && 'name' in e) ? String(e.name) : '';
      const msgFromErr = (e && typeof e === 'object' && 'message' in e) ? String(e.message) : '';
      const fallback = (typeof e === 'string' && e) ? e : '';
      const msg = msgFromErr || fallback || (e && e.toString && e.toString()) || '';

      // Known cases: WalletNotSelectedError, userRejected (wallet denied), or extension not installed
      if (name.toLowerCase().includes('walletnotselected') || msg.toLowerCase().includes('wallet') || msg.toLowerCase().includes('not installed')){
        setError('No wallet selected or wallet extension not installed. Install Phantom: https://phantom.app/');
      } else if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('user denied')){
        setError('Connection request was rejected by the wallet.');
      } else if (msg) {
        setError(msg);
      } else {
        setError('Failed to connect to wallet.');
      }
    }
  };

  const [copied,setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWalletList, setShowWalletList] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const handleCopy = async () => {
    if (!publicKey) return;
    try{
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setMenuOpen(false);
    }catch(e){ /* ignore */ }
  };

  const handleToggleMenu = () => {
    setMenuOpen(v => !v);
    setShowWalletList(false);
  };

  const handleSelectWallet = async (name: string) => {
    try{
      await select(name as any);
      await connect();
      setMenuOpen(false);
      setShowWalletList(false);
    }catch(e:any){
      setError(e?.message || 'Failed to switch wallet');
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent){
      if (!wrapperRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!wrapperRef.current.contains(e.target)){
        setMenuOpen(false);
        setShowWalletList(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
      {showLogo && (
        <div style={{minWidth:220}}>
          <img src="/logo.png" alt="Hoods DAO" style={{width:200,borderRadius:12}}/>
        </div>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {singleButton ? (
          <div ref={wrapperRef} style={{position:'relative',display:'inline-block'}}>
            {connected ? (
              <>
                <button
                  className={compact ? 'btn btn-compact' : 'btn'}
                  onClick={handleToggleMenu}
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                >
                  {copied ? 'Copied' : shortKey(publicKey)}
                </button>
                {menuOpen && (
                  <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',background:'#fff',border:'1px solid #ddd',borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.08)',zIndex:60,minWidth:180}}>
                    <div style={{display:'flex',flexDirection:'column'}}>
                      <button onClick={handleCopy} style={{padding:10,textAlign:'left',border:'none',background:'transparent',cursor:'pointer'}}>Copy address</button>
                      <button onClick={() => setShowWalletList(s => !s)} style={{padding:10,textAlign:'left',border:'none',background:'transparent',cursor:'pointer'}}>Change wallet</button>
                      <button onClick={() => { disconnect(); setMenuOpen(false); }} style={{padding:10,textAlign:'left',border:'none',background:'transparent',cursor:'pointer'}} disabled={disconnecting}>Disconnect</button>
                      {showWalletList && (
                        <div style={{borderTop:'1px solid #eee',padding:8,display:'flex',flexDirection:'column',gap:6}}>
                          {wallets && wallets.length > 0 ? wallets.map((w) => (
                            <button key={(w as any).name} onClick={() => handleSelectWallet((w as any).name)} style={{padding:8,textAlign:'left',border:'1px solid #f0f0f0',borderRadius:6,background:'#fafafa',cursor:'pointer'}}>{(w as any).name}</button>
                          )) : <div style={{padding:8,color:'#777'}}>No wallets available</div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button className={compact ? 'btn btn-compact' : 'btn'} onClick={handleConnect} disabled={connecting}>{connecting ? 'Connecting...' : 'Connect'}</button>
            )}
            {error && <div style={{color:'salmon',marginTop:8}}>{error}</div>}
          </div>
        ) : (
          connected ? (
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{fontSize:13}}>Connected: {shortKey(publicKey)}</div>
              <button className={compact ? 'btn btn-compact' : 'btn'} onClick={handleCopy} aria-label="Copy address">Copy</button>
              <button className={compact ? 'btn btn-compact' : 'btn'} onClick={() => disconnect()} disabled={disconnecting}>Disconnect</button>
            </div>
          ) : (
            <div>
              <button className={compact ? 'btn btn-compact' : 'btn'} onClick={handleConnect} disabled={connecting}>{connecting ? 'Connecting...' : 'Connect Wallet'}</button>
              {error && <div style={{color:'salmon',marginTop:8}}>{error}</div>}
            </div>
          )
        )}
      </div>
    </div>
  );
}
