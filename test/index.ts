import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { ethers } from "hardhat";
import { CollectionConfig } from "../config/CollectionConfig";
import { ContractArguments } from "../config/ContractArguments";
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
    PrimaryData: [
      {
        name: "recipient",
        type: "address",
      },
      { name: "quantity", type: "uint256" },
      { name: "tokenId", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };
  const tokenIds = getTokenIds();

  let message!: {
    recipient: string;
    quantity: number;
    tokenId: number;
    nonce: string;
  };

  before(async function () {
    [owner, externalUser, paperKeySigner, recipient] =
      await ethers.getSigners();
    message = {
      recipient: recipient?.address,
      quantity: 1,
      tokenId: getFirstTokenId(tokenIds),
      nonce: ethers.utils.formatBytes32String(nonce(31)),
    };
    const Contract = await ethers.getContractFactory(
      CollectionConfig.contractName
    );
    Contract.connect(owner);
    contract = (await Contract.deploy(
      paperKeySigner.address,
      ...ContractArguments.slice(1)
    )) as NftContractType;
    await contract.deployed();

    domain = {
      name: "Paper",
      version: "1",
      chainId: await paperKeySigner.getChainId(),
      verifyingContract: contract.address,
    };
  });

  it("Paper generated signature can mint", async function () {
    const signature = await paperKeySigner._signTypedData(
      domain,
      types,
      message
    );

    await contract.paperMint(
      message.recipient,
      message.quantity,
      message.tokenId,
      message.nonce,
      signature
    );

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
      contract.paperMint(
        message.recipient,
        message.quantity,
        message.tokenId,
        message.nonce,
        signature
      )
    ).to.be.revertedWith("'Mint request already processed");
  });

  it("Non paper wallets cannot generate signature to mint", async function () {
    const signature = await externalUser._signTypedData(domain, types, message);

    await expect(
      contract.paperMint(
        message.recipient,
        message.quantity,
        message.tokenId,
        message.nonce,
        signature
      )
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

  it("Before setting mint-able token", async function () {
    // No one can mint if token is not set
    expect(
      contract.connect(externalUser1).claimTo(externalUser1.address, 1, 0)
    ).to.be.revertedWith("Not live yet");
    expect(
      contract.connect(holder).claimTo(holder.address, 1, 0)
    ).to.be.revertedWith("Not live yet");
    expect(
      contract.connect(owner).claimTo(owner.address, 1, 0)
    ).to.be.revertedWith("Not live yet");

    // Owner can still mint to user
    const holderAddr = await holder.getAddress();
    await (
      await contract
        .connect(owner)
        .mint(holderAddr, 1, getFirstTokenId(tokenIds))
    ).wait();
    expect(
      contract.balanceOf(holderAddr, getFirstTokenId(tokenIds))
    ).to.deep.equal(ethers.BigNumber.from(1));

    await (
      await contract
        .connect(owner)
        .mintBatch(
          holderAddr,
          [2, 3],
          [getFirstTokenId(tokenIds), getFirstTokenId(tokenIds) + 1]
        )
    ).wait();
    expect(
      contract.balanceOf(holderAddr, getFirstTokenId(tokenIds))
    ).to.deep.equal(ethers.BigNumber.from(3));
    expect(
      contract.balanceOf(holderAddr, getFirstTokenId(tokenIds) + 1)
    ).to.deep.equal(ethers.BigNumber.from(3));
  });

  it("Should be able to set mintable token", async function () {});

  it("Owner only functions", async function () {
    expect(
      contract
        .connect(externalUser1)
        .mint(await externalUser1.getAddress(), 1, getFirstTokenId(tokenIds))
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(
      contract.connect(externalUser1).setLive(getFirstTokenId(tokenIds), false)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(
      contract
        .connect(externalUser1)
        .setPrice(getFirstTokenId(tokenIds), utils.parseEther("0.0000001"))
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
