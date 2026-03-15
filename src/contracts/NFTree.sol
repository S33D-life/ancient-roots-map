// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title NFTree — Ancient Friends On-Chain Collectibles
 * @notice ERC-721 contract for minting ecological proof-of-care NFTs on Base.
 *
 * @dev Trust model:
 *   - The contract uses EIP-712 signed authorizations instead of MINTER_ROLE.
 *   - A backend "authorizer" signs a typed struct granting a specific wallet
 *     permission to mint ONE NFTree, tied to a specific Staff NFT, tree, and
 *     offering.
 *   - The contract verifies:
 *       1. The signature was produced by a wallet holding AUTHORIZER_ROLE
 *       2. The authorization has not expired
 *       3. The nonce has not been used (replay protection)
 *       4. msg.sender matches the authorized wallet
 *       5. msg.sender currently owns the specified Staff NFT on-chain
 *   - This means the user sends the transaction (pays gas), but cannot mint
 *     without a fresh backend authorization. The backend cannot force a mint
 *     to a wallet that doesn't own the Staff.
 *
 * @dev Provenance:
 *   - Tree and offering IDs are stored as bytes32 (keccak256 of UUIDs) to
 *     save gas while preserving verifiability.
 *   - The full UUID can be hashed off-chain to match the on-chain value.
 */
contract NFTree is ERC721, ERC721URIStorage, AccessControl, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant AUTHORIZER_ROLE = keccak256("AUTHORIZER_ROLE");

    /// @notice EIP-712 type hash for mint authorization
    bytes32 public constant MINT_AUTH_TYPEHASH = keccak256(
        "MintAuth(address minter,uint256 staffTokenId,bytes32 treeRef,bytes32 offeringRef,string metadataURI,uint256 nonce,uint256 deadline)"
    );

    /// @notice Address of the Staff NFT contract (for ownership checks)
    address public immutable staffContract;

    uint256 private _nextTokenId;

    /// @notice Nonces consumed per authorization (replay protection)
    mapping(bytes32 => bool) public usedNonces;

    /// @notice Provenance record for each minted NFTree
    struct Provenance {
        bytes32 treeRef;       // keccak256(treeId UUID)
        bytes32 offeringRef;   // keccak256(offeringId UUID)
        uint256 staffTokenId;  // Staff NFT token ID used to seal
        address minter;        // Original minter wallet
        uint256 mintedAt;      // Block timestamp
    }

    mapping(uint256 => Provenance) public provenance;

    /// @notice Emitted when a new NFTree is minted with full provenance
    event NFTreeMinted(
        uint256 indexed tokenId,
        address indexed minter,
        uint256 staffTokenId,
        bytes32 treeRef,
        bytes32 offeringRef,
        string metadataURI
    );

    constructor(
        address defaultAdmin,
        address _staffContract
    ) ERC721("NFTree", "NFTREE") EIP712("NFTree", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(AUTHORIZER_ROLE, defaultAdmin);
        staffContract = _staffContract;
        _nextTokenId = 1;
    }

    /**
     * @notice Mint a new NFTree using a backend-signed EIP-712 authorization.
     * @param metadataURI    IPFS/gateway URI pointing to ERC-721 metadata JSON
     * @param staffTokenId   Staff NFT token ID the minter is using to seal
     * @param treeRef        keccak256 of tree UUID
     * @param offeringRef    keccak256 of offering UUID
     * @param nonce          Unique nonce (from backend) for replay protection
     * @param deadline       Unix timestamp after which the authorization expires
     * @param signature      EIP-712 signature from an AUTHORIZER_ROLE holder
     * @return tokenId       The newly minted token ID
     */
    function mintAuthorized(
        string calldata metadataURI,
        uint256 staffTokenId,
        bytes32 treeRef,
        bytes32 offeringRef,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant returns (uint256) {
        // 1. Check deadline
        require(block.timestamp <= deadline, "NFTree: authorization expired");

        // 2. Check nonce not used
        bytes32 nonceKey = keccak256(abi.encodePacked(msg.sender, nonce));
        require(!usedNonces[nonceKey], "NFTree: nonce already used");
        usedNonces[nonceKey] = true;

        // 3. Verify EIP-712 signature from an authorizer
        bytes32 structHash = keccak256(abi.encode(
            MINT_AUTH_TYPEHASH,
            msg.sender,
            staffTokenId,
            treeRef,
            offeringRef,
            keccak256(bytes(metadataURI)),
            nonce,
            deadline
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(hasRole(AUTHORIZER_ROLE, signer), "NFTree: invalid authorizer");

        // 4. Verify msg.sender owns the Staff NFT on-chain
        // Uses ERC-721 ownerOf — reverts if token doesn't exist
        (bool success, bytes memory data) = staffContract.staticcall(
            abi.encodeWithSignature("ownerOf(uint256)", staffTokenId)
        );
        require(success && data.length >= 32, "NFTree: staff ownership check failed");
        address staffOwner = abi.decode(data, (address));
        require(staffOwner == msg.sender, "NFTree: caller does not own staff token");

        // 5. Mint
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);

        provenance[tokenId] = Provenance({
            treeRef: treeRef,
            offeringRef: offeringRef,
            staffTokenId: staffTokenId,
            minter: msg.sender,
            mintedAt: block.timestamp
        });

        emit NFTreeMinted(tokenId, msg.sender, staffTokenId, treeRef, offeringRef, metadataURI);
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
