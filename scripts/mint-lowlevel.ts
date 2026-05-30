import fs from 'fs';
import path from 'path';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction
} from '@solana/spl-token';
import { createCreateMetadataAccountV2Instruction, DataV2, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

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
  const rpc = process.env.RPC_URL || 'https://api.devnet.solana.com';

  const payer = await loadKeypair(payerPath);
  const updateAuthority = await loadKeypair(updateAuthorityPath);

  const connection = new Connection(rpc, 'confirmed');

  console.log('Payer:', payer.publicKey.toBase58());
  console.log('Update authority:', updateAuthority.publicKey.toBase58());

  // Create mint account
  const mint = Keypair.generate();
  const lamportsForMint = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  const createMintIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: MINT_SIZE,
    lamports: lamportsForMint,
    programId: TOKEN_PROGRAM_ID
  });

  const initMintIx = createInitializeMintInstruction(mint.publicKey, 0, payer.publicKey, updateAuthority.publicKey, TOKEN_PROGRAM_ID);

  // Create associated token account for payer
  const ata = await getAssociatedTokenAddress(mint.publicKey, payer.publicKey);
  const createAtaIx = createAssociatedTokenAccountInstruction(payer.publicKey, ata, payer.publicKey, mint.publicKey);

  // Mint 1 token to ATA
  const mintToIx = createMintToInstruction(mint.publicKey, ata, payer.publicKey, 1, [], TOKEN_PROGRAM_ID);

  // Create metadata PDA
  const [metadataPda] = await PublicKey.findProgramAddress([
    Buffer.from('metadata'),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    mint.publicKey.toBuffer()
  ], TOKEN_METADATA_PROGRAM_ID);

  const dataV2: DataV2 = {
    name: 'Rogue Devnet #1',
    symbol: 'ROGUE',
    uri: metadataUrl,
    sellerFeeBasisPoints: 0,
    creators: [
      { address: payer.publicKey, verified: false, share: 100 }
    ],
    collection: null,
    uses: null
  };

  const createMetadataIx = createCreateMetadataAccountV2Instruction({
    metadata: metadataPda,
    mint: mint.publicKey,
    mintAuthority: payer.publicKey,
    payer: payer.publicKey,
    updateAuthority: updateAuthority.publicKey
  }, {
    createMetadataAccountArgsV2: {
      data: dataV2,
      isMutable: true
    }
  });

  const tx = new Transaction().add(createMintIx, initMintIx, createAtaIx, mintToIx, createMetadataIx);

  console.log('Sending transaction to create mint and metadata...');
  const sig = await sendAndConfirmTransaction(connection, tx, [payer, mint], { commitment: 'confirmed' });
  console.log('Transaction signature:', sig);
  console.log('Mint address:', mint.publicKey.toBase58());
  console.log('Metadata PDA:', metadataPda.toBase58());
  console.log('Associated token account:', ata.toBase58());
}

main().catch(err => { console.error(err); process.exit(1); });
