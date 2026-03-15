// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NFTree — Ancient Friends On-Chain Collectibles
 * @notice ERC-721 contract for minting ecological proof-of-care NFTs on Base.
 *         Minting is gated by the MINTER_ROLE, which should be held by a
 *         trusted backend relayer that verifies Staff NFT ownership before
 *         authorising each mint.
 *
 * @dev Architecture:
 *   - Client submits mint request to edge function with wallet signature.
 *   - Edge function verifies Staff NFT ownership on-chain, then calls
 *     this contract via a MINTER_ROLE-holding relayer wallet.
 *   - Each token stores provenance: treeId, offeringId, staffTokenId, minter.
 *   - Metadata URI points to IPFS / gateway.
 */
contract NFTree is ERC721, ERC721URIStorage, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextTokenId;

    /// @notice Provenance record for each minted NFTree
    struct Provenance {
        string treeId;        // Supabase tree UUID
        string offeringId;    // Supabase offering UUID
        uint256 staffTokenId; // Staff NFT token ID used to seal
        address minter;       // Original minter wallet
        uint256 mintedAt;     // Block timestamp
    }

    mapping(uint256 => Provenance) public provenance;

    /// @notice Emitted when a new NFTree is minted with full provenance
    event NFTreeMinted(
        uint256 indexed tokenId,
        address indexed minter,
        string treeId,
        string offeringId,
        uint256 staffTokenId,
        string tokenURI
    );

    constructor(address defaultAdmin) ERC721("NFTree", "NFTREE") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _nextTokenId = 1;
    }

    /**
     * @notice Mint a new NFTree with full provenance.
     * @param to          Recipient wallet (the staff holder)
     * @param uri         IPFS metadata URI
     * @param treeId      Supabase tree UUID
     * @param offeringId  Supabase offering UUID
     * @param staffTokenId Staff NFT token ID used to authorise this mint
     * @return tokenId    The newly minted token ID
     */
    function mint(
        address to,
        string calldata uri,
        string calldata treeId,
        string calldata offeringId,
        uint256 staffTokenId
    ) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        provenance[tokenId] = Provenance({
            treeId: treeId,
            offeringId: offeringId,
            staffTokenId: staffTokenId,
            minter: to,
            mintedAt: block.timestamp
        });

        emit NFTreeMinted(tokenId, to, treeId, offeringId, staffTokenId, uri);
        return tokenId;
    }

    /**
     * @notice Total number of NFTrees minted.
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ── Required overrides ────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
