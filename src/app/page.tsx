"use client";

import { ConnectWallet, MediaRenderer, ThirdwebProvider, embeddedWallet, useAddress, useSDK } from "@thirdweb-dev/react";
import { useState } from "react";

export default function Home() {
  return (
    <ThirdwebProvider
      activeChain="mumbai"
      clientId={process.env.NEXT_PUBLIC_CLIENT_ID}
      supportedWallets={[
        embeddedWallet()
      ]}
    >
      <ClaimPage />
    </ThirdwebProvider>
  )
}

const ClaimPage = () => {
  const address = useAddress();
  const sdk = useSDK();
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [isImageGenerated, setIsImageGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isMinted, setIsMinted] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userPrompt: imagePrompt })
      });

      if(!res.ok) {
        throw new Error("Error generating image");
      }

      const data = await res.json();
      const b64json = `{"imageData":"data:image/png;base64,${data.data[0].b64_json}"}`
      const obj = JSON.parse(b64json);
      const base64ImageData = obj.imageData;
      
      await setGeneratedImage(base64ImageData);
      setImagePrompt("");
      setIsLoading(false);
      setIsImageGenerated(true);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const mintNFT = async (imageData: any) => {
    setIsMinting(true);
    try {
      const fetchResponse = await fetch(imageData);
      const blob = await fetchResponse.blob();

      const file = new File([blob], "image.png", {type: "image/png"});
      const imageUri = await sdk?.storage.upload(file);

      if(!imageUri) {
        throw new Error("Error uploading image");
      }

      const res = await fetch("/api/mintNFT", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userImage: imageUri,
          address: address
        })
      });
  
      if (res.ok) {
        alert("NFT Minted!");
      } else {
        const errorData = await res.json();
        console.error("Error minting NFT:", errorData);
        alert("Error minting NFT: " + (errorData.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error(error);
      alert("An error occurred: " + error.message);
    } finally {
      setIsMinting(false);
      setIsMinted(true);
    }
  };
  

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh"
    }}>
      <ConnectWallet 
        btnTitle="Login"
      />
      {address && (
        <>
          {!isImageGenerated ? (
            <div style={{ 
              width:"512px", 
              height:"512px",
              border: "1px solid #222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
              margin: "40px 0px"
            }}>
              <h3>{
                isLoading ? "Generating..." : "Enter a prompt below and click generate"
              }</h3>
            </div>
          ) : (
            <MediaRenderer
              src={generatedImage}
              alt={imagePrompt}
              width="512px"
              height="512px"
              style={{
                borderRadius: "10px",
                margin: "40px 0px",
              }}
            />
          )}
          {isImageGenerated ? (
            <>
              {isMinted ? (
                <p style={{
                  width: "400px",
                  padding: "10px",
                  margin: "10px auto 0px auto",
                  textAlign: "center",
                  border: "1px solid forestgreen",
                  color: "forestgreen",
                  borderRadius: "4px",
                }}>NFT Minted!</p>
              ) : (
                <button
                  style={{
                    width: "400px",
                    padding: "10px",
                    marginTop: "10px",
                    cursor: "pointer"
                  }}
                  disabled={isMinting}
                  onClick={() => mintNFT(generatedImage)}
                >{
                  isMinting ? "Minting..." : "Mint NFT"
                }</button>
              )}
              
              <button
                onClick={() => {
                  setIsImageGenerated(false);
                  setGeneratedImage("");
                  setIsImageGenerated(false);
                  setIsMinted(false);
                }}
                style={{
                  width: "400px",
                  padding: "10px",
                  marginTop: "10px",
                  cursor: "pointer"
                }}
              >{
                isMinted ? "Generate Another" : "Re-Generate"
              }</button>
            </>
          ) : (
            <>
              <input 
                type="text"
                placeholder="Image Prompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                style={{
                  width: "400px",
                  padding: "10px",
                }}
              />
              <button
                onClick={handleGenerate}
                style={{
                  width: "400px",
                  padding: "10px",
                  marginTop: "10px",
                  cursor: "pointer"
                }}
                disabled={isLoading}
              >{
                isLoading ? "Generating..." : "Generate"
              }</button>
            </>
          )}
        </>
      )}
    </div>
  )
};