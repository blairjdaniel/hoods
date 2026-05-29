// AvatarUploader removed from landing page; loaded on-demand elsewhere if needed

export const metadata = { title: 'Hoods DAO — Landing' };

import R2Image from '../../components/R2Image';

export default async function LandingPage(){
  const s3Endpoint = (process.env.S3_API_ENDPOINT || '').replace(/\/$/, '');
  const pageMediaBase = (process.env.R2_PAGE_MEDIA_PUBLIC_BASE || 'trait-swap').replace(/^\//, '').replace(/\/$/, '');

  if (!s3Endpoint) console.warn('S3_API_ENDPOINT is not set — landing images will not be fetched from cloud. Set S3_API_ENDPOINT to your Cloudflare R2 endpoint.');

  const candidateBg = s3Endpoint && pageMediaBase ? `${s3Endpoint}/${pageMediaBase}/004.png` : '';
  const candidateBurrow = s3Endpoint && pageMediaBase ? `${s3Endpoint}/${pageMediaBase}/Burrowborn/0.png` : '';

  // Server-side HEAD check to ensure remote image exists; fall back to empty string to avoid local fallbacks
    // Generate signed URLs for private images
    // Use client-side component to request signed URLs at runtime
    const bgUrl = '';
    const burrowUrl = '';
    const uthUrl = '';
  return (
    <div style={{maxWidth:1100,margin:'40px auto',padding:20}}>
      <div className="landing-grid">
        <div>
          <R2Image objectKey="trait-swap/collection.png" bucket="hoodsdao" expireSeconds={900} fallback="/trait-swap/004.png" alt="hero" style={{width:'100%',borderRadius:12}} />
          <h2 style={{marginTop:18}}>Welcome to Hoods DAO</h2>
          

          <a href="/trait-swap" className="trait-block fade-in-up" style={{marginTop:18}}>
              <R2Image objectKey="trait-swap/004.png" bucket="hoodsdao" expireSeconds={900} fallback="/trait-swap/004.png" className="bg" alt="Hoods Trait Swap" />
            <div className="overlay">
              <h3>Hoods Trait Swap</h3>
            </div>
          </a>
          
          <a href="/burrowborn" className="trait-block fade-in-up" style={{marginTop:18}}>
              <R2Image objectKey="trait-swap/0.png" bucket="hoodsdao" expireSeconds={900} fallback="/Burrowborn/0.png" className="bg" alt="Burrowborn" />
            <div className="overlay">
              <h3>Burrowborn</h3>
            </div>
          </a>

          <a href="/under-the-hood" className="trait-block fade-in-up" style={{marginTop:18}}>
            <R2Image objectKey="trait-swap/pod_cover.png" bucket="hoodsdao" expireSeconds={900} fallback="/UTH/IMG_5698.JPG" className="bg" alt="Under The Hood" />
            <div className="overlay">
              <h3>Under The Hood</h3>
            </div>
          </a>
        </div>

        {/* aside removed; connect button moved to header */}
      </div>
    </div>
  );
}
