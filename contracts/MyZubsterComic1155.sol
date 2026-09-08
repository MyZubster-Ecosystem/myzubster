// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MyZubster Comic Collection
/// @notice ERC-1155 collection for batch-minting MyZubster comic artwork.
/// @dev Metadata stays off-chain and should resolve through immutable IPFS URIs.
contract MyZubsterComic1155 is ERC1155URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    event ComicBatchMinted(
        address indexed recipient,
        uint256[] tokenIds,
        uint256[] amounts,
        string[] metadataURIs
    );

    constructor() ERC1155("") {}

    function mintComicBatch(
        address recipient,
        string[] calldata metadataURIs,
        uint256[] calldata amounts
    ) external onlyOwner returns (uint256[] memory tokenIds) {
        require(recipient != address(0), "Comic: zero recipient");
        require(metadataURIs.length > 0, "Comic: empty batch");
        require(metadataURIs.length == amounts.length, "Comic: length mismatch");

        tokenIds = new uint256[](metadataURIs.length);

        for (uint256 i = 0; i < metadataURIs.length; i++) {
            require(bytes(metadataURIs[i]).length > 0, "Comic: empty URI");
            require(amounts[i] > 0, "Comic: zero amount");

            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            _setURI(tokenId, metadataURIs[i]);
        }

        _mintBatch(recipient, tokenIds, amounts, "");
        emit ComicBatchMinted(recipient, tokenIds, amounts, metadataURIs);
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function uri(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        return super.uri(tokenId);
    }
}
