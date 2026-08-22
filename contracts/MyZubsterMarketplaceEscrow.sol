// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MyZubsterMarketplaceEscrow
 * @notice Atomic MYZ-for-ERC721 settlement for the MyZubster marketplace.
 *
 * Sellers escrow an NFT in this contract when creating a listing. A buyer then
 * approves MYZ and calls buy(). The MYZ payment and NFT delivery happen in the
 * same transaction, so either both complete or the whole purchase reverts.
 */
contract MyZubsterMarketplaceEscrow is ReentrancyGuard, IERC721Receiver {
    using SafeERC20 for IERC20;

    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    IERC20 public immutable paymentToken;
    uint256 public nextListingId = 1;

    mapping(uint256 => Listing) public listings;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );
    event Purchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    event Cancelled(uint256 indexed listingId, address indexed seller);

    constructor(address paymentToken_) {
        require(paymentToken_ != address(0), "payment token required");
        paymentToken = IERC20(paymentToken_);
    }

    function list(address nftContract, uint256 tokenId, uint256 price)
        external
        nonReentrant
        returns (uint256 listingId)
    {
        require(nftContract != address(0), "nft contract required");
        require(price > 0, "price must be positive");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "not token owner");

        listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        // Custody is established before a listing becomes usable by a buyer.
        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit Listed(listingId, msg.sender, nftContract, tokenId, price);
    }

    function buy(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "listing inactive");
        require(msg.sender != listing.seller, "seller cannot buy");

        listing.active = false;

        // If either transfer fails, the EVM reverts the entire transaction.
        paymentToken.safeTransferFrom(msg.sender, listing.seller, listing.price);
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );

        emit Purchased(listingId, msg.sender, listing.seller, listing.price);
    }

    function cancel(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "listing inactive");
        require(listing.seller == msg.sender, "not listing seller");

        listing.active = false;
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            listing.seller,
            listing.tokenId
        );

        emit Cancelled(listingId, listing.seller);
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        override
        returns (bytes4)
    {
        return IERC721Receiver.onERC721Received.selector;
    }
}
