import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { CollectionConfig } from "../config/CollectionConfig";
import ContractArguments from "../config/ContractArguments";
import { NftContractType } from "../lib/NftContractProvider";
import { getFirstTokenId, getTokenIds, nonce } from "../lib/utils";
import { IERC20 } from "../typechain-types";

const IERC20 = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";

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
    contract = (await Contract.connect(owner).deploy(
      paperKeySigner.address,
      ...ContractArguments.slice(1)
    )) as NftContractType;
    await contract.deployed();

    const mintDetails = CollectionConfig.mintDetails[0];

    await contract
      .connect(owner)
      .launchToken(
        mintDetails.tokenId,
        ethers.constants.AddressZero,
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
  const USDC_ETH_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  let owner!: SignerWithAddress;
  let externalUser1!: SignerWithAddress;
  let holder!: SignerWithAddress;
  let externalUser2!: SignerWithAddress;
  let contract!: NftContractType;
  const tokenIds = getTokenIds();

  let usdcContract!: IERC20;
  let usdcWhale!: SignerWithAddress;

  before(async function () {
    [owner, externalUser1, externalUser2, holder] = await ethers.getSigners();
    usdcWhale = await ethers.getImpersonatedSigner(
      "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549"
    );
    usdcContract = (await ethers.getContractAt(
      IERC20,
      USDC_ETH_ADDRESS
    )) as IERC20;
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
        ethers.constants.AddressZero,
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

  it("Should be able to mint with USDC", async function () {
    const mintDetails = CollectionConfig.mintDetails[0];
    await contract.launchToken(
      mintDetails.tokenId,
      USDC_ETH_ADDRESS,
      ethers.utils.parseUnits("0.5", "6"),
      mintDetails.maxSupply,
      mintDetails.maxMintPerTx,
      mintDetails.uri
    );

    const price = await contract.price(mintDetails.tokenId);

    await usdcContract.connect(usdcWhale).approve(contract.address, price);
    await contract.connect(usdcWhale).claimTo(externalUser1.address, 1, 0);

    expect(await usdcContract.balanceOf(contract.address)).to.deep.equal(price);

    expect(await contract.price(mintDetails.tokenId)).to.deep.equal(
      ethers.utils.parseUnits("0.5", "6")
    );
    expect(await contract.currency(mintDetails.tokenId)).to.equal(
      USDC_ETH_ADDRESS
    );
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
      contract
        .connect(externalUser1)
        .withdrawNativeCoin(await externalUser1.getAddress())
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(
      contract
        .connect(externalUser1)
        .withdrawCurrency(USDC_ETH_ADDRESS, await externalUser1.getAddress())
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should be able to withdraw funds", async function () {
    const mintDetails = CollectionConfig.mintDetails[0];
    const initAmount = await ethers.provider.getBalance(externalUser1.address);
    await contract.connect(owner).withdrawNativeCoin(externalUser1.address);
    expect(
      (await ethers.provider.getBalance(externalUser1.address)).gt(initAmount)
    ).to.be.true;

    const initBalance = ethers.utils.parseUnits("1", "6");
    expect(await usdcContract.balanceOf(externalUser1.address)).to.deep.equal(
      initBalance
    );
    const price = ethers.utils.parseUnits("0.5", "6");
    await contract
      .connect(owner)
      .withdrawCurrency(externalUser1.address, USDC_ETH_ADDRESS);
    expect(await usdcContract.balanceOf(externalUser1.address)).to.deep.equal(
      price.add(initBalance)
    );
  });
});
