// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MyZubster Comic Universe
/// @notice ERC-721 collection for MyZubster Comic Universe narrative assets.
/// @dev Metadata is stored off-chain and referenced through tokenURI (IPFS in the current deployment).
contract MyZubsterComicNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event ComicMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string tokenURI
    );

    constructor() ERC721("MyZubster Comic Universe", "MYZCOMIC") {}

    function mintComic(
        address recipient,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit ComicMinted(tokenId, recipient, metadataURI);

        return tokenId;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
