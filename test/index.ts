import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { CollectionConfig } from "../config/CollectionConfig";
import ContractArguments from "../config/ContractArguments";
import { NftContractType } from "../lib/NftContractProvider";
import { getFirstTokenId, getTokenIds, nonce } from "../lib/utils";

describe("Paper mint function", function () {
  let owner!: SignerWithAddress;
  let paperKeySigner!: SignerWithAddress;
  let externalUser!: SignerWithAddress;
  let recipient!: SignerWithAddress;
  let contract!: NftContractType;

  // signature stuff
  let domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  const types = {
    MintData: [
      {
        name: "recipient",
        type: "address",
      },
      { name: "quantity", type: "uint256" },
      { name: "tokenId", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "data", type: "bytes" },
    ],
  };
  const tokenIds = getTokenIds();

  let message!: {
    recipient: string;
    quantity: number;
    tokenId: number;
    nonce: string;
    data: string;
  };

  before(async function () {
    [owner, externalUser, paperKeySigner, recipient] =
      await ethers.getSigners();

    const Contract = await ethers.getContractFactory(
      CollectionConfig.contractName
    );
    Contract.connect(owner);
    contract = (await Contract.deploy(
      paperKeySigner.address,
      ...ContractArguments.slice(1)
    )) as NftContractType;
    await contract.deployed();

    const mintDetails = CollectionConfig.mintDetails[0];

    await contract
      .connect(owner)
      .launchToken(
        mintDetails.tokenId,
        ethers.utils.parseEther(mintDetails.priceInEther.toString()),
        mintDetails.maxSupply,
        mintDetails.maxMintPerTx,
        mintDetails.uri
      );

    domain = {
      name: "Paper",
      version: "1",
      chainId: await paperKeySigner.getChainId(),
      verifyingContract: contract.address,
    };
    message = {
      recipient: recipient?.address,
      quantity: 1,
      tokenId: getFirstTokenId(tokenIds),
      nonce: ethers.utils.formatBytes32String(nonce(31)),
      data: "0x",
    };
  });

  it("Paper generated signature can mint", async function () {
    const signature = await paperKeySigner._signTypedData(
      domain,
      types,
      message
    );

    await contract.paperMint({ ...message, signature });

    expect(
      await contract.balanceOf(recipient.address, getFirstTokenId(tokenIds))
    ).deep.equal(BigNumber.from(1));
  });
  it("Minting with the same signature again should fail", async function () {
    const signature = await paperKeySigner._signTypedData(
      domain,
      types,
      message
    );
    await expect(
      contract.paperMint({ ...message, signature })
    ).to.be.revertedWith("'Mint request already processed");
  });

  it("Non paper wallets cannot generate signature to mint", async function () {
    const signature = await externalUser._signTypedData(domain, types, message);

    await expect(
      contract.paperMint({ ...message, signature })
    ).to.be.revertedWith("Invalid signature");
  });
});

describe(CollectionConfig.contractName, () => {
  let owner!: SignerWithAddress;
  let externalUser1!: SignerWithAddress;
  let holder!: SignerWithAddress;
  let externalUser2!: SignerWithAddress;
  let contract!: NftContractType;
  const tokenIds = getTokenIds();

  before(async function () {
    [owner, externalUser1, externalUser2, holder] = await ethers.getSigners();
  });

  it("Contract deployment", async function () {
    const Contract = await ethers.getContractFactory(
      CollectionConfig.contractName
    );
    contract = (await Contract.deploy(...ContractArguments)) as NftContractType;

    await contract.deployed();
    expect(contract.address).to.not.be.empty;
    expect(contract.address).to.match(/^0x.*/);
  });

  it("Check initial data", async function () {
    expect(await contract.name()).to.equal(CollectionConfig.tokenName);
    expect(await contract.symbol()).to.equal(CollectionConfig.tokenSymbol);
    expect(await contract.price(0)).to.equal(0);
    expect(await contract.price(1)).to.equal(0);
    expect(await contract.price(2121312)).to.equal(0);
    expect(await contract.maxTokenSupply(0)).to.equal(0);
    expect(await contract.maxTokenSupply(1)).to.equal(0);
    expect(await contract.maxTokenSupply(923812)).to.equal(0);
    expect(await contract.maxMintPerTx(0)).to.equal(0);
    expect(await contract.maxMintPerTx(1)).to.equal(0);
    expect(await contract.maxMintPerTx(923812)).to.equal(0);
    expect(await contract.isLive(0)).to.equal(false);
    expect(await contract.isLive(1)).to.equal(false);
    expect(await contract.isLive(124152)).to.equal(false);
    expect(await contract.uri(0)).to.be.empty;
    expect(await contract.uri(1)).to.be.empty;
    expect(await contract.uri(15124)).to.be.empty;
  });

  it("Should not be able to mint token", async function () {
    // No one can mint if token is not set
    expect(
      contract
        .connect(externalUser1)
        .claimTo(externalUser1.address, 1, getFirstTokenId(tokenIds))
    ).to.be.revertedWith("Not live yet");
    expect(
      contract
        .connect(holder)
        .claimTo(holder.address, 1, getFirstTokenId(tokenIds))
    ).to.be.revertedWith("Not live yet");
    expect(
      contract
        .connect(owner)
        .claimTo(owner.address, 1, getFirstTokenId(tokenIds))
    ).to.be.revertedWith("Not live yet");
  });

  it("Should be able to set mint and mint token", async function () {
    const mintDetails = CollectionConfig.mintDetails[0];
    expect(
      contract.connect(holder).claimTo(holder.address, 1, mintDetails.tokenId)
    ).to.be.revertedWith("Not live yet");

    await contract
      .connect(owner)
      .launchToken(
        mintDetails.tokenId,
        ethers.utils.parseEther(mintDetails.priceInEther.toString()),
        mintDetails.maxSupply,
        mintDetails.maxMintPerTx,
        mintDetails.uri
      );
    expect(await contract.price(mintDetails.tokenId)).to.be.deep.equal(
      ethers.utils.parseEther(mintDetails.priceInEther.toString())
    );
    expect(await contract.maxMintPerTx(mintDetails.tokenId)).to.deep.equal(
      mintDetails.maxMintPerTx
    );
    expect(await contract.maxTokenSupply(mintDetails.tokenId)).to.equal(
      mintDetails.maxSupply
    );
    expect(await contract.isLive(mintDetails.tokenId)).to.be.true;
    expect(await contract.uri(mintDetails.tokenId)).to.be.equal(
      mintDetails.uri
    );
    expect(await contract.unclaimedSupply(mintDetails.tokenId)).to.equal(
      mintDetails.maxSupply
    );

    const holderAddr = await holder.getAddress();
    expect(
      contract.connect(holder).claimTo(holderAddr, 1, mintDetails.tokenId)
    ).to.be.revertedWith("Insufficient funds for purchase");
    expect(
      contract.connect(holder).claimTo(holderAddr, 0, mintDetails.tokenId)
    ).to.be.revertedWith("Invalid mint amount!");
    expect(
      contract
        .connect(holder)
        .claimTo(holderAddr, mintDetails.maxSupply + 1, mintDetails.tokenId)
    ).to.be.revertedWith("Invalid mint amount!");

    await contract.connect(holder).claimTo(holderAddr, 1, mintDetails.tokenId, {
      value: ethers.utils.parseEther(mintDetails.priceInEther.toString()),
    });
    expect(
      await contract.balanceOf(holderAddr, mintDetails.tokenId)
    ).to.deep.equal(ethers.BigNumber.from(1));

    expect(await contract.unclaimedSupply(mintDetails.tokenId)).to.equal(
      mintDetails.maxSupply - 1
    );

    expect(
      contract
        .connect(holder)
        .claimTo(holderAddr, mintDetails.maxSupply, mintDetails.tokenId)
    ).to.be.revertedWith("Max supply exceeded!");
  });

  it("Owner only functions", async function () {
    expect(
      contract.connect(externalUser1).setLive(getFirstTokenId(tokenIds), false)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(
      contract
        .connect(externalUser1)
        .setPrice(
          getFirstTokenId(tokenIds),
          ethers.utils.parseEther("0.0000001")
        )
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(
      contract
        .connect(externalUser1)
        .setMaxMintPerTx(getFirstTokenId(tokenIds), 99999)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(
      contract
        .connect(externalUser2)
        .setMaxTokenSupply(getFirstTokenId(tokenIds), 1000)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(
      contract
        .connect(externalUser2)
        .setURI(getFirstTokenId(tokenIds), "ipfs://something_here")
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(
      contract.connect(externalUser2).setPaperKey("new_paper_key")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    expect(
      contract.connect(externalUser1).withdraw(await externalUser1.getAddress())
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
