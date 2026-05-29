import { redirect } from 'next/navigation';

export default function Page() {
  // Server-side redirect to landing page so the landing page is the app root
  redirect('/landing');
}
  import { redirect } from 'next/navigation';

  export default function Page() {
    // Server-side redirect to landing page so the landing page is the app root
    redirect('/landing');
  }
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
