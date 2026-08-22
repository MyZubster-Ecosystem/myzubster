// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MyZubsterCharacter is ERC721URIStorage, Ownable, Pausable {
    uint256 public immutable maxSupply;
    uint256 private _nextTokenId = 1;

    mapping(address => bool) public hasMintedCharacter;

    event CharacterMinted(address indexed owner, uint256 indexed tokenId, string tokenURI);

    constructor(uint256 maxSupply_) ERC721("MyZubster Character", "MYZCHAR") {
        require(maxSupply_ > 0, "max supply is zero");
        maxSupply = maxSupply_;
    }

    function mintCharacter(string calldata tokenURI_) external whenNotPaused returns (uint256 tokenId) {
        require(!hasMintedCharacter[msg.sender], "character already minted");
        require(_nextTokenId <= maxSupply, "max supply reached");
        require(bytes(tokenURI_).length > 0, "token URI required");

        tokenId = _nextTokenId++;
        hasMintedCharacter[msg.sender] = true;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        emit CharacterMinted(msg.sender, tokenId, tokenURI_);
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
