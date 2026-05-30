import fs from 'fs';
import path from 'path';
import { Connection, Keypair, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';

async function loadKeypair(p: string): Promise<Keypair> {
  const resolved = p.startsWith('~') ? p.replace('~', process.env.HOME || '') : p;
  const raw = fs.readFileSync(path.resolve(resolved), 'utf8');
  const arr = JSON.parse(raw) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

async function main() {
  const payerPath = process.env.PAYER_KEYPAIR || `${process.env.HOME}/.config/solana/id.json`;
  const updateAuthorityPath = process.env.UPDATE_AUTHORITY_KEYPAIR || payerPath;
  const metadataUrl = process.env.METADATA_URL || 'https://raw.githubusercontent.com/blairjdaniel/hoods/main/public/metadata/3tD7BZSHoM.json';
  const rpc = process.env.RPC_URL || clusterApiUrl('devnet');

  console.log('Using RPC:', rpc);
  console.log('Using metadata URL:', metadataUrl);

  const payer = await loadKeypair(payerPath);
  const updateAuthority = await loadKeypair(updateAuthorityPath);

  const connection = new Connection(rpc, 'confirmed');
  const metaplex = Metaplex.make(connection).use(keypairIdentity(payer));

  console.log('Payer:', payer.publicKey.toBase58());
  console.log('Update authority:', updateAuthority.publicKey.toBase58());

  // Create the NFT; identity (payer) will pay the tx and be the mint authority.
  // We set `updateAuthority` explicitly to the provided keypair's public key.
  const { nft } = await metaplex.nfts().create({
    uri: metadataUrl,
    name: 'Rogue Devnet #1',
    symbol: 'ROGUE',
    sellerFeeBasisPoints: 0,
    maxSupply: 1,
    isMutable: true,
    updateAuthority: updateAuthority.publicKey
  });

  console.log('Minted NFT:');
  console.log('  mint:', nft.address.toBase58());
  console.log('  metadata:', nft.metadataAddress.toBase58());
  console.log('  updateAuthority:', nft.updateAuthorityAddress?.toBase58() || updateAuthority.publicKey.toBase58());
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
