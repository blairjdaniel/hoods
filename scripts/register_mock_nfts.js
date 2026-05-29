#!/usr/bin/env node
/*
Simpler registration script using Metaplex JS to create NFTs on devnet.
- Reads metadata JSON files from `public/mock-rogues/index.json`.
- Optionally uploads images and metadata to R2 if `S3_API_ENDPOINT` + R2 creds are set.
- Uses Metaplex SDK to create NFTs and set the owner to `TARGET_OWNER` env var (or payer if unset).

Usage:
  KEYPAIR_PATH=~/.config/solana/id.json TARGET_OWNER=<pubkey> node scripts/register_mock_nfts.js

Caveats:
- If you don't upload metadata to R2, metadata URLs will point to localhost (http://localhost:3000/...), which requires the dev server to be running for explorers to fetch metadata.
*/

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Connection, Keypair, PublicKey, clusterApiUrl } = require('@solana/web3.js');

// Metaplex
const { Metaplex, keypairIdentity } = require('@metaplex-foundation/js');

const MOCK_DIR = path.join(process.cwd(), 'public', 'mock-rogues');
const INDEX_PATH = path.join(MOCK_DIR, 'index.json');

const S3_ENDPOINT = process.env.S3_API_ENDPOINT || '';
const R2_PUBLIC_BASE = (process.env.R2_PAGE_MEDIA_PUBLIC_BASE || 'mock-rogues/').replace(/^\/+/, '');
const S3_BUCKET_BASE_URL = S3_ENDPOINT ? S3_ENDPOINT.replace(/\/+$/, '') : null;

async function uploadToR2(key, body, contentType) {
  if (!S3_ENDPOINT) throw new Error('S3_API_ENDPOINT not configured');
  const client = new S3Client({
    endpoint: S3_ENDPOINT,
    region: process.env.AWS_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  const params = {
    Bucket: process.env.R2_PAGE_MEDIA_BUCKET || '',
    Key: key,
    Body: body,
    ContentType: contentType || 'application/octet-stream',
  };
  await client.send(new PutObjectCommand(params));
  return `${S3_BUCKET_BASE_URL}/${key}`;
}

function loadKeypair() {
  const keypairPath = process.env.KEYPAIR_PATH || (process.env.HOME ? path.join(process.env.HOME, '.config', 'solana', 'id.json') : null);
  if (!keypairPath || !fs.existsSync(keypairPath)) throw new Error('Keypair file not found. Set KEYPAIR_PATH env or create a solana keypair at ~/.config/solana/id.json');
  const raw = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

(async function main(){
  try {
    if (!fs.existsSync(INDEX_PATH)) throw new Error('Missing mock index: ' + INDEX_PATH);
    const payer = loadKeypair();
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const metaplex = Metaplex.make(connection).use(keypairIdentity(payer));

    const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    const targetOwner = process.env.TARGET_OWNER || payer.publicKey.toBase58();
    const targetPubkey = new PublicKey(targetOwner);

    console.log('Registering', index.length, 'mock NFTs for owner', targetOwner);

    for (const rel of index) {
      const metaPath = path.join(process.cwd(), 'public', rel.replace(/^\/+/, ''));
      if (!fs.existsSync(metaPath)) {
        console.warn('Skipping missing file:', metaPath);
        continue;
      }
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

      // Upload image if R2 configured
      let imageUrl = meta.image;
      if (S3_ENDPOINT && meta.image && meta.image.startsWith('/')) {
        const localImage = path.join(process.cwd(), meta.image.replace(/^\//, ''));
        if (fs.existsSync(localImage)) {
          const key = `${R2_PUBLIC_BASE}${path.basename(localImage)}`;
          console.log('Uploading image to R2:', key);
          imageUrl = await uploadToR2(key, fs.readFileSync(localImage), 'image/png');
          console.log('Uploaded image ->', imageUrl);
        }
      }

      // Prepare metadata URL
      let metadataUrl;
      if (S3_ENDPOINT) {
        const key = `${R2_PUBLIC_BASE}${path.basename(rel)}`;
        console.log('Uploading metadata to R2:', key);
        const body = Buffer.from(JSON.stringify(Object.assign({}, meta, { image: imageUrl })));
        metadataUrl = await uploadToR2(key, body, 'application/json');
        console.log('Uploaded metadata ->', metadataUrl);
      } else {
        metadataUrl = `http://localhost:3000${rel}`;
        console.log('Using local metadata URL (ensure dev server running):', metadataUrl);
      }

      // Create NFT on devnet and assign to target owner
      console.log('Creating NFT via Metaplex:', meta.name || rel);
      try {
        const nft = await metaplex.nfts().create({
          uri: metadataUrl,
          name: meta.name || 'Rogue (devnet)',
          sellerFeeBasisPoints: 0,
          symbol: meta.symbol || 'RG',
          isMutable: true,
          maxSupply: 0,
          tokenOwner: targetPubkey,
        });
        const mint = nft.mintAddress ? nft.mintAddress.toBase58() : nft?.mint?.toBase58?.();
        console.log('Created NFT mint:', mint, 'metadata uri:', metadataUrl);
      } catch (e) {
        console.error('Metaplex create failed, attempting fallback simple mint (no metadata):', e.message || e.toString());
        // Fallback: simple SPL mint to owner's ATA
        const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');
        const mint = await createMint(connection, payer, payer.publicKey, null, 0);
        const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, targetPubkey);
        await mintTo(connection, payer, mint, ata.address, payer, 1);
        console.log('Fallback minted token to owner ATA:', ata.address.toBase58(), 'mint:', mint.toBase58());
      }

    }

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
