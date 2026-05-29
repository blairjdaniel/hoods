import { redirect } from 'next/navigation';

export default function Page() {
  // Server-side redirect to landing page so the landing page is the app root
  redirect('/landing');
}
  value: string;
}

interface NFTData {
  mint: string;
  mintUrl: string | null;
  updateAuthority: string | null;
  primaryMetadataUpdateAuthority: string | null;
  owner: string | null;
  name: string;
  symbol: string;
  uri: string;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  supply: number;
  decimals: number;
  creators: any[];
  sellerFeeBasisPoints: number;
  attributes: Trait[];
  image: string;
  animationUrl: string | null;
  externalUrl: string | null;
  otherMetadata: any;
  collection: any;
  status: any;
  tokenInfo: any;
  json: any;
}

interface NewTrait {
  trait_type: string;
  value: string;
  imageReplace?: string;
}

interface WalletButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

const WalletButton: React.FC<WalletButtonProps> = ({ children, onClick }) => (
  <button className="btn" onClick={onClick}>
    {children}
  </button>
);

const Input: React.FC<{
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}> = ({ type, value, onChange, placeholder, disabled, className }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    style={{
      padding: "8px",
      fontSize: "14px",
      border: "1px solid #ccc",
      borderRadius: 4,
      minWidth: "200px",
      opacity: disabled ? 0.5 : 1
    }}
    className={className}
  />
);

const SearchInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ value, onChange }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder="Enter mint or wallet address"
    style={{
      padding: "8px",
      fontSize: "14px",
      border: "1px solid #ccc",
      borderRadius: 4,
      width: "100%",
      maxWidth: "400px"
    }}
  />
);

const Button: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ onClick, disabled, children, style }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="btn"
    style={{ ...(style || {}) }}
  >
    {children}
  </button>
);

export default function NFTTraitSwap() {
  const { connected, connect, disconnect, publicKey } = useWallet();
  const [searchAddress, setSearchAddress] = useState("");
  const [selectedNft, setSelectedNft] = useState<NFTData | null>(null);
  const [nftImage, setNftImage] = useState<string | null>(null);
  const [newTraits, setNewTraits] = useState<NewTrait[]>([]);
  const [appliedTraits, setAppliedTraits] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Helius RPC is read from environment (NEXT_PUBLIC_HELIUS_RPC_URL)

  const fetchNFTUsingHelius = async (mintOrAddress: string): Promise<NFTData> => {
    const endpoint = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY_HERE";
    
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(mintOrAddress);
    } catch {
      throw new Error("Invalid Solana address");
    }

    // First try getAssetsByOwner to see if this NFT belongs to this wallet
    let ownerResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-nft-fetch-owner",
        method: "getAssetsByOwner",
        params: {
          owners: [publicKey.toBase58()],
          page: 1,
          limit: 100,
          assetType: "nft",
          displayFields: ["name", "symbol", "collection", "attributes"],
          compressionFields: ["compressed", "compressed", "compressed"],
          tokenVersion: "all",
          dynamicMetadataFields: ["name", "symbol", "collection", "attributes"]
        }
      })
    });

    const ownerResult = await ownerResponse.json();
    
    if (ownerResult.error) {
      throw new Error(ownerResult.error.message || "Helius API error");
    }

    const assets: any[] = ownerResult.result.items || [];
    const nft = assets.find((item: any) => item.mint === publicKey.toBase58());
    
    if (nft) {
      // This is a wallet search - we found the NFT in their ownership
      setSelectedNft(nft);
      setNftImage(nft.tokenInfo?.tokenMetadata?.uri || nft.media?.raw || null);
    }

    // Now try getAsset to fetch by mint directly
    const assetResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-nft-fetch-asset",
        method: "getAsset",
        params: {
          id: publicKey.toBase58(),
          displayFields: ["name", "symbol", "collection", "attributes"],
          compressionFields: ["compressed", "compressed", "compressed"],
          tokenVersion: "all",
          dynamicMetadataFields: ["name", "symbol", "collection", "attributes"]
        }
      })
    });

    const assetResult = await assetResponse.json();
    
    if (assetResult.error) {
      throw new Error(assetResult.error.message || "Helius API error");
    }

    const nftData = assetResult.result;
    
    // Fetch metadata JSON from the URI
    try {
      if (nftData.tokenInfo?.tokenMetadata?.uri) {
        const metadataResponse = await fetch(nftData.tokenInfo.tokenMetadata.uri);
        const metadataJson = await metadataResponse.json();
        nftData.json = metadataJson;
      }
    } catch (metadataError) {
      console.log("Could not fetch metadata JSON:", metadataError);
    }

    // Fetch image URL
    if (nftData.tokenInfo?.tokenMetadata?.uri) {
      try {
        const imageResponse = await fetch(nftData.tokenInfo.tokenMetadata.uri);
        const imageJson = await imageResponse.json();
        nftData.image = imageJson.image;
        setNftImage(imageJson.image);
      } catch (imageError) {
        console.log("Could not fetch image URL:", imageError);
      }
    } else if (nftData.media?.raw) {
      nftData.image = nftData.media.raw;
      setNftImage(nftData.media.raw);
    }

    // Also try to get image from json directly
    if (nftData.json?.image) {
      nftData.image = nftData.json.image;
      setNftImage(nftData.json.image);
    }

    setSelectedNft(nftData);
    return nftData;
  };

  const searchNFT = async (walletAddress?: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const address = walletAddress || (publicKey?.toBase58() || searchAddress);
      if (!address) {
        setError("Please enter a wallet or token mint address");
        setIsLoading(false);
        return;
      }
      
      const nft = await fetchNFTUsingHelius(address);
      setSelectedNft(nft);
      setNftImage(nft.image || null);
      setNewTraits([]);
      setAppliedTraits(new Set());
    } catch (err: any) {
      setError(err.message || "Failed to fetch NFT");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey && !searchAddress) {
      searchNFT();
    } else if (connected && publicKey) {
      searchNFT();
    }
  }, [publicKey, connected]);

  const getTraitsFromNft = (): Trait[] => {
    if (!selectedNft) return [];
    return selectedNft.attributes || [];
  };

  const handleAddTrait = (traitType: string, traitValue: string) => {
    setNewTraits(prev => [...prev, {
      trait_type: traitType,
      value: traitValue,
      imageReplace: "" 
    }]);
  };

  const handleRemoveTrait = (index: number) => {
    setNewTraits(prev => prev.filter((_, i) => i !== index));
  };

  const handleTraitTypeChange = (index: number, value: string) => {
    setNewTraits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], trait_type: value };
      return updated;
    });
  };

  const handleTraitValueChanged = (index: number, value: string) => {
    setNewTraits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  const handleImageReplaceChange = (index: number, value: string) => {
    setNewTraits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], imageReplace: value };
      return updated;
    });
  };

  const toggleTrait = (traitType: string) => {
    setAppliedTraits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(traitType)) {
        newSet.delete(traitType);
      } else {
        newSet.add(traitType);
      }
      return newSet;
    });
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      setError("Could not connect wallet. Make sure Phantom is installed and configured for devnet.");
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setSearchAddress("");
  };

  return (
    <div style={{fontFamily: "Arial, sans-serif",maxWidth:1200,margin:"0 auto",padding:20}}>
      <h1>NFT Trait Swap - Devnet</h1>

      {/* Helius RPC is configured via environment (NEXT_PUBLIC_HELIUS_RPC_URL) */}

      {connected ? (
        <div style={{ 
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "#e8f5e9",
          borderRadius: 4,
          fontSize: "14px"
        }}>
          <span style={{ marginRight: "15px" }}>
            Address: {publicKey?.toBase58()}
          </span>
          <Button onClick={handleDisconnect}>Disconnect</Button>
        </div>
      ) : (
        <WalletButton onClick={handleConnect}>
          Connect Wallet
        </WalletButton>
      )}

      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>Search NFT (mint address or wallet address)</h2>
        <SearchInput value={searchAddress} onChange={e => setSearchAddress(e.target.value)} />
        <Button 
          onClick={() => searchNFT(searchAddress || publicKey?.toBase58())} 
          disabled={isLoading}
          style={{ marginLeft: "10px" }}
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
        {error && (
          <div style={{ 
            marginTop: "10px", 
            padding: "10px", 
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: 4,
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
      </div>

      {selectedNft && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>{selectedNft.name}</h2>
          
          <div style={{ display: "flex", gap: "30px" }}>
            <div style={{ flex: 1 }}>
              <h3>Current NFT</h3>
              <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: 8 }}> 
                {nftImage && (
                  <img 
                    src={nftImage} 
                    alt={selectedNft.name} 
                    style={{ maxWidth: "100%", height: "auto", borderRadius: 4 }} 
                  />
                )}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h3>Current Traits</h3>
              {selectedNft.attributes && selectedNft.attributes.length > 0 ? (
                <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: 8 }}>
                  {selectedNft.attributes.map((trait, index) => (
                    <div key={index} style={{ 
                      padding: "8px", 
                      borderBottom: "1px solid #eee",
                      display: "flex",
                      justifyContent: "space-between"
                    }}>
                      <strong>{trait.trait_type}:</strong> {trait.value}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "14px", color: "#666" }}>No traits found</div>
              )}
            </div>
          </div>

          <div>
            <h3>Try On New Traits</h3>
            <p style={{ fontSize: "13px", color: "#666", marginBottom: "10px" }}>
              Click on a trait below to "Try On". This will overlay your custom transparent PNG on the NFT for preview.
            </p>
            
            {selectedNft.attributes && selectedNft.attributes.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                {selectedNft.attributes.map((trait, index) => (
                  <div 
                    key={index} 
                    className={`trait-item ${appliedTraits.has(trait.trait_type) ? "active" : ""}`}
                    onClick={() => toggleTrait(trait.trait_type)}
                    style={{
                      padding: "10px",
                      border: appliedTraits.has(trait.trait_type) ? "2px solid #0f0f0f" : "1px solid #ccc",
                      backgroundColor: appliedTraits.has(trait.trait_type) ? "#f5f5f5" : "white",
                      borderRadius: 4,
                      cursor: "pointer",
                      minWidth: "150px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px"
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>
                      <strong>{trait.trait_type}:</strong> {trait.value}
                    </span>
                    {appliedTraits.has(trait.trait_type) && (
                      <span style={{ fontSize: "11px", color: "#0f9d58" }}>Try On ✓</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "14px" }}>No traits on this NFT to try on.</p>
            )}

            {newTraits.length > 0 && (
              <div style={{ 
                border: "1px solid #ccc", 
                padding: "15px", 
                borderRadius: 8,
                marginBottom: "20px",
                backgroundColor: "#f9f9f9"
              }}>
                <h4 style={{ fontSize: "16px", marginBottom: "15px" }}>New Traits</h4>
                {newTraits.map((newTrait, index) => (
                  <div key={index} className="new-trait-item" style={{ 
                    padding: "15px", 
                    border: "1px solid #e0e0e0", 
                    borderRadius: 6,
                    marginBottom: "15px",
                    backgroundColor: "white"
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "10px", marginBottom: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Trait Type:</label>
                        <Input
                          type="text"
                          value={newTrait.trait_type}
                          onChange={e => handleTraitTypeChange(index, e.target.value)}
                          placeholder="E.g., Hat, Eyes, Mouth"
                          className={"trait-type-field"}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Value:</label>
                        <Input
                          type="text"
                          value={newTrait.value}
                          onChange={e => handleTraitValueChanged(index, e.target.value)}
                          placeholder="E.g., Cowboy Hat, Sunglasses, Smile"
                          className={"trait-value-field"}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Transparent Image URL:</label>
                        <Input
                          type="text"
                          value={newTrait.imageReplace || ""}
                          onChange={e => handleImageReplaceChange(index, e.target.value)}
                          placeholder="URL to your hand-drawn transparent PNG"
                          className="image-replace-field"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleRemoveTrait(index)}
                      style={{ 
                        backgroundColor: "#f44336", 
                        fontSize: "12px",
                        padding: "6px 12px"
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={() => handleAddTrait("", "")}>
              Add New Trait
            </Button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
