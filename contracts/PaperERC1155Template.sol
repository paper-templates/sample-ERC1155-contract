//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@paperxyz/contracts/verification/PaperVerification.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PaperERC1155Template is ERC1155, Ownable, PaperVerification {
    string public name;
    string public symbol;

    mapping(uint256 => string) public tokenURI;

    // Mapping from tokenId to the max token supply
    mapping(uint256 => uint256) public maxTokenSupply;

    // Mapping from tokenId to the current circulating supply
    mapping(uint256 => uint256) public tokenTotalSupply;

    // Mapping from tokenId too whether the token is available for mint or not
    mapping(uint256 => bool) public isLive;

    // Mapping from tokenId to the max mint per transaction
    mapping(uint256 => uint256) public maxMintPerTx;

    // Mapping from tokenId to price of NFT
    mapping(uint256 => uint256) public price;

    constructor(
        address _paperKey,
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC1155("") PaperVerification(_paperKey) {
        name = _tokenName;
        symbol = _tokenSymbol;
    }

    modifier priceCompliant(uint256 _tokenId, uint256 _quantity) {
        require(
            msg.value >= _quantity * price[_tokenId],
            "Insufficient funds for purchase"
        );
        _;
    }

    modifier mintCompliant(uint256 _tokenId, uint256 _quantity) {
        require(
            _quantity > 0 && _quantity <= maxMintPerTx[_tokenId],
            "Invalid mint amount!"
        );
        require(
            tokenTotalSupply[_tokenId] + _quantity <= maxTokenSupply[_tokenId],
            "Max supply exceeded!"
        );
        _;
    }
    modifier tokenLive(uint256 _tokenId) {
        require(isLive[_tokenId], "Not live yet");
        _;
    }

    function paperMint(
        address _recipient,
        uint256 _quantity,
        uint256 _tokenId,
        // Paper params
        bytes32 _nonce,
        bytes calldata _signature
    )
        external
        tokenLive(_tokenId)
        mintCompliant(_tokenId, _quantity)
        onlyPaper(
            abi.encode(
                keccak256(
                    "PrimaryData(address recipient,uint256 quantity,uint256 tokenId,bytes32 nonce)"
                ),
                _recipient,
                _quantity,
                _tokenId,
                _nonce
            ),
            _nonce,
            _signature
        )
    {
        // todo: your mint info here.
        tokenTotalSupply[_tokenId] += _quantity;
        _mint(_recipient, _tokenId, _quantity, "");
    }

    function claimTo(
        address _to,
        uint256 _quantity,
        uint256 _tokenId
    )
        external
        payable
        mintCompliant(_tokenId, _quantity)
        priceCompliant(_tokenId, _quantity)
        tokenLive(_tokenId)
    {
        tokenTotalSupply[_tokenId] += _quantity;
        _mint(_to, _tokenId, _quantity, "");
    }

    function getClaimIneligibilityReason(
        address _recipient,
        uint256 _quantity,
        uint256 _tokenId
    ) public view returns (string memory) {
        // todo: add your error reasons here.
        if (isLive[_tokenId] == false) {
            return "Token is not available for minting yet";
        } else if (
            tokenTotalSupply[_tokenId] + _quantity > maxTokenSupply[_tokenId]
        ) {
            return "Max supply exceeded";
        } else if (_quantity > maxMintPerTx[_tokenId]) {
            return "Invalid mint amount";
        }
        return "";
    }

    function unclaimedSupply(uint256 _tokenId) public view returns (uint256) {
        return maxTokenSupply[_tokenId] - tokenTotalSupply[_tokenId];
    }

    function setPaperKey(address _paperKey) external onlyOwner {
        _setPaperKey(_paperKey);
    }

    function launchToken(
        uint256 _tokenId,
        uint256 _price,
        uint256 _maxSupply,
        uint256 _maxMintPerTx,
        string memory _uri
    ) external onlyOwner {
        setPrice(_tokenId, _price);
        setMaxTokenSupply(_tokenId, _maxSupply);
        setMaxMintPerTx(_tokenId, _maxMintPerTx);
        setURI(_tokenId, _uri);
        setLive(_tokenId, true);
    }

    function withdraw(address payable _to) external onlyOwner {
        (bool success, ) = _to.call{value: address(this).balance}("");
        require(success, "withdraw failed");
    }

    function setLive(uint256 _tokenId, bool _isLive) public onlyOwner {
        isLive[_tokenId] = _isLive;
    }

    function setMaxMintPerTx(uint256 _tokenId, uint256 _maxMintPerTx)
        public
        onlyOwner
    {
        maxMintPerTx[_tokenId] = _maxMintPerTx;
    }

    function setPrice(uint256 _tokenId, uint256 _price) public onlyOwner {
        price[_tokenId] = _price;
    }

    function setMaxTokenSupply(uint256 _tokenId, uint256 _maxSupply)
        public
        onlyOwner
    {
        maxTokenSupply[_tokenId] = _maxSupply;
    }

    function burn(uint256 _id, uint256 _amount) external {
        _burn(msg.sender, _id, _amount);
    }

    function burnBatch(uint256[] memory _ids, uint256[] memory _amounts)
        external
    {
        _burnBatch(msg.sender, _ids, _amounts);
    }

    function setURI(uint256 _id, string memory _uri) public onlyOwner {
        tokenURI[_id] = _uri;
        emit URI(_uri, _id);
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return tokenURI[_id];
    }
}
