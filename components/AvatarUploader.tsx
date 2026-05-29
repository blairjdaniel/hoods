"use client";
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function AvatarUploader(){
  const { publicKey } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('wallet', publicKey?.toBase58() || 'anonymous');

      const res = await fetch('/api/r2/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setUrl(data.url);
    } catch (e:any) {
      console.error(e);
      alert(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <label style={{display:'block',fontSize:12,color:'#9aa3b2'}}>Upload avatar (PNG/JPG)</label>
      <input type="file" accept="image/*" onChange={handleFile} />
      <button className="btn" onClick={upload} disabled={!file || uploading} style={{marginTop:8}}>{uploading ? 'Uploading...' : 'Upload'}</button>
      {url && (
        <div style={{marginTop:8}}>
          <div style={{fontSize:12,color:'#9aa3b2'}}>Uploaded:</div>
          <img src={url} alt="avatar" style={{width:80,height:80,borderRadius:999,marginTop:6}} />
        </div>
      )}
    </div>
  );
}
